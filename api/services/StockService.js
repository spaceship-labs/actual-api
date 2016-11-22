var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
//.startOf('day').format('DD-MM-YYYY');		

module.exports = {
	getDetailsStock: getDetailsStock,
	substractProductsStock: substractProductsStock
};


//details must be populated with products and shipCompanyFrom
function substractProductsStock(details){
	return Promise.each(details, substractStockByDetail);
}

function substractStockByDetail(detail){
	return Promise.join(
		substractProductStockByDetail(detail),
		substractDeliveryStockByDetail(detail)
	);
}

function substractProductStockByDetail(detail){
	var whsCode = detail.shipCompanyFrom.WhsCode;
	var ItemCode = detail.Product.ItemCode;
	return getStoresWithProduct(ItemCode, whsCode)
		.then(function(stores){
			var storesCodes = stores.map(function(s){return s.code});
			if(detail.quantity > detail.Product.Available){
				return new Promise.reject(new Error('Stock del producto '+ ItemCode + ' no disponible'));
			}
			var newAvailable = detail.Product.Available - detail.quantity;
			var updateValues = {Available: newAvailable};
			for(var i=0;i<storesCodes.length;i++){
				var newCodeStock = detail.Product[storesCodes[i]] - detail.quantity;
				updateValues[storesCodes[i]] = newCodeStock;
				if( isNaN(updateValues[storesCodes[i]]) ){
					updateValues[storesCodes[i]] = 0;
				}
			}
			return Product.update({id:detail.Product.id}, updateValues);
		});
}

function substractDeliveryStockByDetail(detail){
	var whsCode = detail.shipCompanyFrom.WhsCode;
	var ItemCode = detail.Product.ItemCode;

	return DatesDelivery.findOne({
		whsCode: detail.shipCompanyFrom.WhsCode,
		ShipDate: detail.productDate,
		ItemCode: ItemCode
	})
	.then(function(dateDelivery){
		if(detail.quantity > dateDelivery.OpenCreQty){
			return Promise.reject(new Error('Stock del producto ' + ItemCode + ' no disponible'));
		}
		var newStock = dateDelivery.OpenCreQty - detail.quantity;
		return DatesDelivery.update({id: dateDelivery.id}, {OpenCreQty:newStock});
	});
}

function getStoresWithProduct(ItemCode, whsCode){
	return Delivery.find({FromCode: whsCode, Active:'Y'})
		.then(function(deliveries){
			var warehouses = deliveries.map(function(d){return d.ToCode});
			return Company.find({WhsCode: warehouses}).populate('Stores');
		})
		.then(function(warehouses){
			var stores = warehouses.reduce(function(arr, w){
				arr = arr.concat(w.Stores);
				return arr;
			},[]);
			stores = _.uniq(stores, function(s){
				return s.id;
			});
			return stores;
		});
}

//details must be populated with products
function getDetailsStock(details, warehouse){
	var promises = [];
	var productsItemCodes = details.map(function(detail){
		return detail.Product.ItemCode;
	});
	productsItemCodes = _.uniq(productsItemCodes);
	for(var i=0;i<productsItemCodes.length; i++){
		promises.push( Shipping.product(productsItemCodes[i], warehouse) );
	}
	return Promise.all(promises)
		.then(function(results){
			var deliveryDates = results.reduce(function(arr, group){
				arr = arr.concat(group);
				return arr;
			}, []);	
			var finalDetails = mapDetailsWithDeliveryDates(details, deliveryDates);
			return finalDetails;
		});
}

function mapDetailsWithDeliveryDates(details, deliveryDates){
	for(var i = 0; i<details.length; i++){
		var detailDelivery = _.find(deliveryDates, function(delivery){
			var detailShipDate = moment(details[i].shipDate).startOf('day').format('DD-MM-YYYY');
			var deliveryDate = moment(delivery.date).startOf('day').format('DD-MM-YYYY');

			if(detailShipDate === deliveryDate && details[i].quantity <= delivery.available){				
				return true;
			}
			return false;
		});

		if(detailDelivery){
			detailDelivery.available -= details[i].quantity;
			details[i].delivery = detailDelivery;
			details[i].validStock = true;
		}else{
			details[i].validStock = false;			
		}
	}

	return details;
}
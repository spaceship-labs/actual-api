var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
//.startOf('day').format('DD-MM-YYYY');		

module.exports = {
	getDetailsStock: getDetailsStock,
	substractProductsStock: substractProductsStock,
	validateQuotationStockById: validateQuotationStockById
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

function validateQuotationStockById(quotationId, userId){
  var warehouse;
  return Promise.join(
    User.findOne({id: userId}).populate('activeStore'),
    Quotation.findOne({id: quotationId}).populate('Details')
  ).then(function(results){
    var user = results[0];
    var whsId = user.activeStore.Warehouse;
    details = results[1].Details;
    var detailsIds = details.map(function(d){ return d.id; });
    return [
      Company.findOne({id: whsId}),
      QuotationDetail.find({id: detailsIds}).populate('Product')
    ];
  })
  .spread(function(warehouse,details){
    return StockService.getDetailsStock(details, warehouse);    
  })
  .then(function(detailsStock){
  	//console.log('detailsStock', detailsStock);
  	//console.log('isValidStock', isValidStock(detailsStock));
  	return isValidStock(detailsStock);
  });  
}

function isValidStock(detailsStock){
  for(var i=0;i<detailsStock.length; i++){
    if(!detailsStock[i].validStock){
      return false;
    }
  }
  return true;
}

//details must be populated with products
function getDetailsStock(details, warehouse){
	var promises = [];
	var products = details.map(function(detail){
		return detail.Product;
	});
	products = _.uniq(products, function(product){
		return product.ItemCode;
	});
	
	for(var i=0;i<products.length; i++){
		promises.push( Shipping.product(products[i], warehouse) );
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
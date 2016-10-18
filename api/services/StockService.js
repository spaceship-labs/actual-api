var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
//.startOf('day').format('DD-MM-YYYY');		

module.exports = {
	getDetailsStock: getDetailsStock
};

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
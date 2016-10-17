var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
//.startOf('day').format('DD-MM-YYYY');		

module.exports = {
	getDetailsDeliveries: getDetailsDeliveries
};

//details must be populated with products
function getDetailsDeliveries(details, whsId){
	var promises = [];
	var productsItemCodes = details.map(function(detail){
		return detail.Product.ItemCode;
	});
	productsItemCodes = _.uniq(productsItemCodes);
	for(var i=0;i<productsItemCodes.length; i++){
		promises.push( Shipping.product(productsItemCodes[i], whsId) );
	}
	return Promise.all(promises)
		.then(function(results){
			sails.log.info('results');
			sails.log.info(results);
			return results;
		})
}

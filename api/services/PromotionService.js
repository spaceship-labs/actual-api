var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
var Promise = require('bluebird');

module.exports ={
	getProductMainPromo: getProductMainPromo,
  getProductActivePromotions: getProductActivePromotions,
  getPromotionWithHighestDiscount: getPromotionWithHighestDiscount
};

function getProductMainPromo(productId){
  var currentDate = new Date();	
	var promotionsQuery = {
    startDate: {'$lte': currentDate},
    endDate: {'$gte': currentDate},		
	};
	var productFind = Common.nativeFindOne({_id: ObjectId(productId)}, Product);
	var promotionsFind = Common.nativeFind(promotionsQuery, Promotion);

	return Promise.join(productFind, promotionsFind)
		.then(function(results){
			var product = results[0];
			var activePromotions = results[1];

      if(!product){
        return Promise.reject(new Error('Producto no encontrado'));
      }

			var promotions = getProductActivePromotions(product, activePromotions);
			return getPromotionWithHighestDiscount(promotions);
		});
}


function getProductActivePromotions(product, activePromotions){
  activePromotions = activePromotions.filter(function(promotion){
    var isValid = false;
    if(promotion.sa){
      var productSA = product.U_Empresa;
      if(promotion.sa === productSA && product.Discount === promotion.discountPg1){
        isValid = true;
      } 
    }

    return isValid;
  });

  return activePromotions;
}

function getPromotionWithHighestDiscount(promotions){
	if(promotions.length <= 0){
		return false;
	}

  var indexMaxPromo = 0;
  var maxDiscount = 0;
  promotions = promotions || [];
  promotions.forEach(function(promo, index){
    if(promo.discountPg1 >= maxDiscount){
      maxDiscount   = promo.discountPg1;
      indexMaxPromo = index;
    }
  });	
  return promotions[indexMaxPromo];
}
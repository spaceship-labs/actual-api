var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
var Promise = require('bluebird');
var _ = require('underscore');
var STUDIO_CODE = '001';
var AMBAS_CODE = '003';
var CLIENT_FIXED_DISCOUNT = 'F';
var CLIENT_ADDITIONAL_DISCOUNT = 'M';

module.exports ={
  areSpecialClientPromotions: areSpecialClientPromotions,
  removeSpecialClientPromotions: removeSpecialClientPromotions,
	getProductMainPromo: getProductMainPromo,
  getProductActivePromotions: getProductActivePromotions,
  getPromotionWithHighestDiscount: getPromotionWithHighestDiscount,
  STUDIO_CODE: STUDIO_CODE,
  AMBAS_CODE: AMBAS_CODE
};

function getProductMainPromo(productId, quotationId){
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

			return getProductActivePromotions(product, activePromotions, quotationId);
		})
    .then(function(productActivePromotions){
      return getPromotionWithHighestDiscount(productActivePromotions);      
    });
}

function getProductActivePromotions(product, activePromotions, quotationId){
  var productActivePromotions = activePromotions.filter(function(promotion){
    var isValid = false;
    if(promotion.sa){
      var productSA = getProductSA(product);

      if(promotion.sa === productSA){
        isValid = true;
      } 
    }

    return isValid;
  });

  productActivePromotions = filterByHighestRegisteredPromotion(productActivePromotions);
  
  return mapRelatedPromotions(productActivePromotions, product, quotationId);
}

function filterByHighestRegisteredPromotion(productActivePromotions){
  if(productActivePromotions.length === 0){
    return [];
  }
  var highestDiscountPromo = getPromotionWithHighestDiscount(productActivePromotions);
  var highestDiscount = highestDiscountPromo.discountPg1;

  return productActivePromotions.filter(function(promotion){
    return promotion.discountPg1 === highestDiscount;
  });
}

function mapRelatedPromotions(promotions, product, quotationId){
  var mappedPromotions = [];

  if(product.Discount){
    mappedPromotions = promotions.map(function(promotion){
      var auxPromotion = {
        discountPg1: product.Discount,
        discountPg2: getRelatedPromotionGroupDiscount(2, promotion, product), 
        discountPg3: getRelatedPromotionGroupDiscount(3, promotion, product), 
        discountPg4: getRelatedPromotionGroupDiscount(4, promotion, product), 
        discountPg5: getRelatedPromotionGroupDiscount(5, promotion, product) 
      };

      promotion = _.extend(promotion, auxPromotion);
      return promotion;
    });
  }

  /*
  return new Promise(function(resolve, reject){
    resolve(mappedPromotions);    
  });
  */
  return mapClientDiscountWithPromotions(mappedPromotions, product, quotationId);

}

function mapClientDiscountWithPromotions(promotions, product, quotationId){
  var clientFound = true;
  var productSA = getProductSA(product);

  return Quotation.findOne({id: quotationId}).populate('Client')
    .then(function(quotation){
      if(quotation && quotation.Client){
        var client = quotation.Client;
        var currentDate = new Date();
        var clientDiscountsQuery = {
          U_SocioNegocio: client.CardCode,
          U_VigDesde: {'<=': currentDate},
          U_VigHasta: {'>=': currentDate},    
          U_Sociedad: productSA      
        };
        return ClientDiscount.findOne(clientDiscountsQuery);
      }else{
        clientFound = false;
        return promotions;
      }
    })
    .then(function(result){
      var clientDiscount;

      if(clientFound){
        clientDiscount = result;
      }

      if(clientDiscount && !_.isUndefined(clientDiscount.U_Porcentaje2) ){
        
        if(clientDiscount.U_FijoMovil === CLIENT_ADDITIONAL_DISCOUNT){
          promotions = mapClientAdditionalDiscounts(promotions, clientDiscount);
        }
        else if(clientDiscount.U_FijoMovil === CLIENT_FIXED_DISCOUNT){
          promotions = mapClientFixedDiscounts(promotions, clientDiscount);
        }

        if(  (!promotions || promotions.length === 0) ){
  
          if(clientDiscount.U_FijoMovil === CLIENT_FIXED_DISCOUNT){
            promotions = [
              buildClientFixedDiscount(clientDiscount)
            ];
          }
          else if( clientDiscount.U_FijoMovil === CLIENT_ADDITIONAL_DISCOUNT ){
            promotions = [
              buildClientAdditionalDiscount({
                discountPg1: 0
              }, clientDiscount)
            ];
          }
        }
      }


      return promotions;
    });
}

function mapClientFixedDiscounts(promotions, clientDiscount){
  return promotions.map(function(promotion){
    promotion = _.extend(_.clone(promotion), buildClientFixedDiscount(clientDiscount));
    return promotion;
  });
}

function buildClientFixedDiscount(clientDiscount){
  var fixedDiscount = clientDiscount.U_Porcentaje2;
  var defaultName = 'Descuento fijo cliente '+ clientDiscount.U_SocioNegocio +' '+ fixedDiscount + '%';
  var clientDiscountReference = 'clientFixedDiscount-' + fixedDiscount + '-' + clientDiscount.U_SocioNegocio;
  clientDiscountReference += '-code-' + clientDiscount.Code;

  return {
    discountPg1: fixedDiscount,
    discountPg2: 0,
    discountPg3: 0,
    discountPg4: 0,
    discountPg5: 0,
    name: defaultName,
    publicName: defaultName,
    handle: 'descuento-cliente-'+clientDiscount.U_SocioNegocio+'-' + fixedDiscount + '-porciento',
    clientDiscountReference: clientDiscountReference
  };
}

function buildClientAdditionalDiscount(promotion, clientDiscount){
  var additionalDiscount = clientDiscount.U_Porcentaje2;
  var auxPromotion = {};
  var defaultName = 'Descuento cliente '+ clientDiscount.U_SocioNegocio +' ' + promotion.discountPg1 + '% mas ' + additionalDiscount + '%';
  var clientDiscountReference = 'clientAdditionalDiscount-' + additionalDiscount + '-' + clientDiscount.U_SocioNegocio;
  clientDiscountReference += '-originalDiscount-' + promotion.discountPg1;
  clientDiscountReference += '-code-' + clientDiscount.Code;

  auxPromotion.discountPg1 = promotion.discountPg1 + additionalDiscount;
  auxPromotion.discountPg2 = 0,
  auxPromotion.discountPg3 = 0,
  auxPromotion.discountPg4 = 0,
  auxPromotion.discountPg5 = 0,
  auxPromotion.name = defaultName,
  auxPromotion.publicName = defaultName,
  auxPromotion.handle = 'descuento-cliente-'+ clientDiscount.U_SocioNegocio +'-' + auxPromotion.discountPg1 + 'mas' + additionalDiscount + '-porciento-adicional';    
  auxPromotion.clientDiscountReference = clientDiscountReference;
  auxPromotion = _.extend(_.clone(promotion), auxPromotion);

  return auxPromotion;

}

function mapClientAdditionalDiscounts(promotions, clientDiscount){
  return promotions.map(function(promotion){
    return buildClientAdditionalDiscount(promotion, clientDiscount);
  });
}

function getRelatedPromotionGroupDiscount(group, promotion, product){
  var originalCashDiscount = promotion.discountPg1;
  var originalGroupDiscount = promotion['discountPg' + group];
  var difference = originalCashDiscount - originalGroupDiscount;
  var groupDiscount = product.Discount - difference;

  return groupDiscount;
}

function getPromotionWithHighestDiscount(promotions){
	if(promotions.length <= 0){
		return false;
	}

  var highestDiscountPromo;
  var indexMaxPromo = 0;
  var maxDiscount = 0;
  promotions = promotions || [];

  //sails.log.info('promotions in getPromotionWithHighestDiscount', promotions);
  promotions.forEach(function(promo, index){
    if(promo.discountPg1 >= maxDiscount){
      maxDiscount   = promo.discountPg1;
      indexMaxPromo = index;
    }
  });	
  highestDiscountPromo = promotions[indexMaxPromo];
  return highestDiscountPromo;
}

function getProductSA(product){
  var productSA = product.U_Empresa;
  if(productSA === AMBAS_CODE || !productSA){
    productSA = STUDIO_CODE;
  }  
  return productSA;
}

function areSpecialClientPromotions(promotions){
  return _.some(promotions,function(promotion){
    return promotion.clientDiscountReference;
  });
}

function removeSpecialClientPromotions(promotions){
  return promotions.filter(function(promotion){
    return !promotion.clientDiscountReference;
  });
}
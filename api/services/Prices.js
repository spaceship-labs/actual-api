var Promise = require('bluebird');
var _ = require('underscore');
var storePromotions         = [];
var storePackages           = [];
var currentPromotionPackage = false;
var DEFAULT_EXCHANGE_RATE   = 18.78;

module.exports = {
  processDetails: processDetails,
  getQuotationTotals: getQuotationTotals,
  updateQuotationTotals: updateQuotationTotals,
  getExchangeRate: getExchangeRate
};

//@params details: Array of objects from model Detail
//Every detail must contain a Product object populated
function processDetails(details, opts){
  opts = opts || {paymentGroup:1};
  var processedDetails = details.map(function(d){
    return getDetailTotals(d, opts);
  });

  return Promise.all(processedDetails).then(function(pDetails){
    if(opts.updateDetails){
      return updateDetails(pDetails);
    }else{
      return pDetails;
    }
  });
}

function updateDetails(details){
  var updatedDetails = details.map(function(d){
    return updateDetail(d).then(function(updated){
      if(updated && updated.length > 0){
        return updated[0];
      }
      return null;
    });
  });
  return Promise.all(updatedDetails);
}

function updateDetail(detail){
  return QuotationDetail.update({id: detail.id}, detail);
}

//@params: detail Object from model Detail
//Must contain a Product object populated
function getDetailTotals(detail, opts){
  opts = opts || {};
  paymentGroup = opts.paymentGroup || 1;
  var subTotal = 0;
  var total = 0;
  var productId = detail.Product;
  var quantity = detail.quantity;
  var currentDate = new Date();
  var queryPromos = Search.getPromotionsQuery();
  return Product.findOne({id:productId})
    .populate('Promotions', queryPromos)
    .then(function(p){
      var mainPromo       = getProductMainPromo(p, quantity);
      var unitPrice       = p.Price;
      var discountKey     = getDiscountKey(opts.paymentGroup);
      var discountPercent = mainPromo ? mainPromo[discountKey] : 0;
      var subtotal        = quantity * unitPrice;
      var total           = quantity * ( unitPrice - ( ( unitPrice / 100) * discountPercent ) );
      var discount        = total - subtotal;
      var detailTotals    = {
        id: detail.id,
        unitPrice: unitPrice,
        discountPercent: discountPercent,
        discountKey: discountKey, //Payment group discountKey
        subtotal: subtotal,
        total:total,
        paymentGroup: opts.paymentGroup,
        quantity: quantity,
        discount: discount
      }
      if(mainPromo.id && !mainPromo.PromotionPackage){
        detailTotals.Promotion = mainPromo.id;
      }

/*      
      sails.log.info('Product: ' + p.ItemCode);
      sails.log.info('paymentGroup: ' + opts.paymentGroup);
      sails.log.info('mainPromo');
      sails.log.info(mainPromo);
      sails.log.info('detail total: ' + total);
      sails.log.info('discountPercent: ' + discountPercent);
      sails.log.info('--------------');
*/
      return detailTotals;
    })
}

function getPromosByStore(storeId){
  var currentDate = new Date();
  var queryPromos = Search.getPromotionsQuery();
  return Store.findOne({id:storeId}).populate('Promotions', queryPromos)
    .then(function(store){
      return store.Promotions;
    })
}

//@params product Object from model Product
//Populated with promotions
function getProductMainPromo(product, quantity){
  var promotions = product.Promotions;
  var packageRule = getDetailPackageRule(product.id, quantity)
  promotions = matchWithStorePromotions(promotions);
  //Taking package rule as a promotion
  if(packageRule){
    promotions = promotions.concat([packageRule]);
  }
  return getPromotionWithHighestDiscount(promotions);
}

function getPromotionWithHighestDiscount(productPromotions){
  if(productPromotions.length <= 0){
    return false;
  }
  var indexMaxPromo = 0;
  var maxDiscount = 0;
  productPromotions = productPromotions || [];
  productPromotions.forEach(function(promo, index){
    if(promo.discountPg1 >= maxDiscount){
      maxDiscount   = promo.discountPg1;
      indexMaxPromo = index;
    }
  });
  return productPromotions[indexMaxPromo] || false;
}

function getDetailPackageRule(productId, quantity){
  if(currentPromotionPackage.PackageRules.length > 0){
    var query = {
      Product : productId,
      quantity: quantity
    };
    var detailRuleMatch = _.findWhere(currentPromotionPackage.PackageRules, query)
    //if( detailRuleMatch && !detailRuleMatch.applied){
    if( detailRuleMatch && !detailRuleMatch.applied){    
      detailRuleMatch.applied = true;
      return detailRuleMatch;
    }
  }
  return false;
}


function matchWithStorePromotions(productPromotions){
  var promotions = productPromotions.filter(function(promotion){
    return _.findWhere(storePromotions, {id:promotion.id});
  });  
  return promotions;
}

function isAStorePackage(promotionPackageId){
  return _.findWhere(storePackages, {id: promotionPackageId});
}

function getDiscountKey(group){
  var keys = ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'];
  return keys[group-1];
}

function updateQuotationTotals(quotationId, opts){
  opts = opts || {paymentGroup:1 , updateDetails: true};
  return getQuotationTotals(quotationId, opts)
    .then(function(totals){
      if(opts && opts.updateParams){
        totals = _.extend(totals, opts.updateParams);
      }
      return Quotation.update({id:quotationId}, totals);
    });
}

function getQuotationTotals(quotationId, opts){
  opts = opts || {paymentGroup:1 , updateDetails: true};
  sails.log.warn('corrio getQuotationTotals');
  sails.log.info('currentPromotionPackage')
  sails.log.info(currentPromotionPackage);
  sails.log.info('--------------------------------');
  //currentPromotionPackage = false;
  //currentPackageRules = []; 
  var quotationAux = false;

  return getPromosByStore(opts.currentStore)
    .then(function(promos){
      storePromotions = promos;
      return Quotation.findOne({id:quotationId}).populate('Details') 
    })
    .then(function(quotation){
      quotationAux = quotation; 
      var currentPromotionPackageId = getCurrentPromotionPackageId(quotation.Details);
      if(currentPromotionPackageId){
        return [
          getPackagesByStore(opts.currentStore),
          ProductGroup.findOne({id:currentPromotionPackageId}).populate('PackageRules')
        ];
      }
      return [ [], false ];
    })
    .spread(function(storePackagesFound, promotionPackage){
      storePackages = storePackagesFound;
      if( isValidPromotionPackage(promotionPackage, quotationAux.Details) ){
        currentPromotionPackage = promotionPackage;
      }
      return processDetails(quotationAux.Details, opts);
    })
    .then(function(processedDetails){
      var totals = {
        subtotal:0,
        total:0,
        discount:0,
        totalProducts: 0
      };
      processedDetails.forEach(function(pd){
        totals.total+= pd.total;
        totals.subtotal += pd.subtotal;
        totals.discount += (pd.subtotal - pd.total);
        totals.totalProducts += pd.quantity;
      });
      return totals;
    });
}

function isValidPromotionPackage(promotionPackage, details){
  if(promotionPackage && promotionPackage.id){
    if (
      isAStorePackage(promotionPackage.id) && 
      validatePackageRules(promotionPackage.PackageRules, details) 
    ){
      return true;
    }
  }
  return false;
}

function getCurrentPromotionPackageId(details){
  var exists = false;
  for (var i=0;i<details.length;i++){
    if(details[i].PromotionPackage){
      exists = details[i].PromotionPackage;
    }
  }
  return exists;
}

function getPackagesByStore(storeId){
  var queryPromos = Search.getPromotionsQuery();
  return Store.findOne({id:storeId})
    .populate('PromotionPackages', queryPromos)
    .then(function(store){
      if(store){
        return store.PromotionPackages;
      }
      return [];
    });
}

function getExchangeRate(){
  return Site.findOne({handle:'actual-group'}).then(function(site){
    return site.exchangeRate || DEFAULT_EXCHANGE_RATE;
  });
}

function validatePackageRules(rules, details){
  var validFlag = true;
  var rulesValidated = 0;
  for(var i = 0; i < rules.length; i++){
    var rule = rules[i];
    if(!isValidPackageRule(rule, details)){
      validFlag = false;
    }
    rulesValidated++;    
  }
  if(rulesValidated < rules.length){
    validFlag = false;
  }
  return validFlag;
}

function isValidPackageRule(rule, details){
  var isValidRule = _.find(details, function(detail){
    return (detail.Product === rule.Product && detail.quantity === rule.quantity);
  });
  return isValidRule;  
}
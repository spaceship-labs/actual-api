var Promise = require('bluebird');
var _ = require('underscore');
var storePromotions         = [];
var storePackages           = [];
var currentPromotionPackage = false;
var DEFAULT_EXCHANGE_RATE   = 18.78;
var currentPackageRules     = [];

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
  //return new Promise(function(resolve, reject){
  return Product.findOne({id:productId})
    .populate('Promotions', queryPromos)
    .then(function(p){
      var mainPromo = getProductMainPromo(p);
      var unitPrice = p.Price;
      var promo = mainPromo ? mainPromo.id : false;
      var discountKey = getDiscountKey(opts.paymentGroup);
      var discountPercent = mainPromo ? mainPromo[discountKey] : 0;
      var subtotal = quantity * unitPrice;
      var total = quantity * ( unitPrice - ( ( unitPrice / 100) * discountPercent ) );
      var discount = total - subtotal;
      var detailTotals = {
        id: detail.id,
        unitPrice: unitPrice,
        Promotion: promo, //Promotion id
        discountPercent: discountPercent,
        discountKey: discountKey, //Payment group discountKey
        subtotal: subtotal,
        total:total,
        paymentGroup: opts.paymentGroup,
        quantity: quantity,
        discount: discount
      }
      return detailTotals;
    })
    .catch(function(err){
      console.log(err);
      reject(err);
    });
}

function getPromosByStore(storeId){
  var currentDate = new Date();
  var queryPromos = Search.getPromotionsQuery();
  return Store.findOne({id:storeId}).populate('Promotions', queryPromos)
    .then(function(store){
      return store.Promotions;
    })
    .catch(function(err){
      console.log(err);
    })
}

//@params product Object from model Product
//Populated with promotions
function getProductMainPromo(product){
  if(product.Promotions && product.Promotions.length > 0){
    product.Promotions = matchWithStorePromotions(product.Promotions);
    return getPromotionWithHighestDiscount(product.Promotions);
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

function getPromotionWithHighestDiscount(productPromotions){
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

function getDiscountKey(group){
  var keys = ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'];
  return keys[group-1];
}

function updateQuotationTotals(quotationId, opts){
  opts = opts || {paymentGroup:1 , updateDetails: true};
  return getQuotationTotals(quotationId, opts).then(function(totals){
    if(opts && opts.updateParams){
      totals = _.extend(totals, opts.updateParams);
    }
    return Quotation.update({id:quotationId}, totals);
  });
}

function getQuotationTotals(quotationId, opts){
  opts = opts || {paymentGroup:1 , updateDetails: true};
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
      if( isValidPromotionPackage(promotionPackage) ){
        currentPromotionPackage = promotionPackage;
        currentPackageRules     = promotionPackage.PackageRules;
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

function isValidPromotionPackage(promotionPackage){
  if(promotionPackage && promotionPackage.id){
    if (isAStorePackage(promotionPackage.id) && validatePackageRules(promotionPackage) ){
      return true;
    }
  }
  return false;
}

function getCurrentPromotionPackageId(details){
  var exists = false;
  for (var i=0;i<details.length;i++){
    if(details[i].PromotionPackage){
      currentPromotionPackage = details[i].PromotionPackage;
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
  for(var i = 0; i < rules.length; i++){
    var rule = rules[i];
    if(!isValidRule(rule, detail)){
      validFlag = false;
    }
  }
  return validFlag;
}

function validatePackageRule(rule, detail){
  var isValidRule = _.find(details, function(detail){
    return (detail.Product.id === rule.Product && detail.quantity === detail.quantity);
  });
  return isValidRule;  
}
var Promise = require('bluebird');
var _ = require('underscore');

var BIGTICKET_TABLE = [
  {min:100000, max:199999.99, maxPercentage:2},
  {min:200000, max:349999.99, maxPercentage:3},
  {min:350000, max:499999.99, maxPercentage:4},
  {min:500000, max:Infinity, maxPercentage:5},
];

var DISCOUNT_KEYS = [
  'discountPg1',
  'discountPg2',
  'discountPg3',
  'discountPg4',
  'discountPg5'
];

var EWALLET_KEYS = [
  'ewalletPg1',
  'ewalletPg2',
  'ewalletPg3',
  'ewalletPg4',
  'ewalletPg5'
];

var EWALLET_TYPES_KEYS = [
  'ewalletTypePg1',
  'ewalletTypePg2',
  'ewalletTypePg3',
  'ewalletTypePg4',
  'ewalletTypePg5'
];

module.exports = {
  Calculator     : Calculator,
  updateQuotationToLatestData: updateQuotationToLatestData
};

function updateQuotationToLatestData(quotationId, userId, options){
  var params = {
    paymentGroup:1,
    updateDetails: true,
  };
  return User.findOne({select:['activeStore'], id: userId})
    .then(function(user){
      params.currentStore = user.activeStore;
      return Quotation.findOne({
        id:quotationId,
        select:['paymentGroup']
      });
    })
    .then(function(quotation){
      if(!quotation){
        return Promise.reject(new Error('Cotización no encontrada'));
      }
      params.paymentGroup = quotation.paymentGroup || 1;
      var calculator = Calculator();
      return calculator.updateQuotationTotals(quotationId, params);
    });
}

function getBigticketMaxPercentage(total){
  var maxPercentage = 0;
  for(var i=0;i<BIGTICKET_TABLE.length;i++){
    if(total >= BIGTICKET_TABLE[i].min && total <= BIGTICKET_TABLE[i].max){
      maxPercentage = BIGTICKET_TABLE[i].maxPercentage;
    }
  }
  return maxPercentage;
}

function Calculator(){
  var storePromotions = [];
  var storePackages   = [];
  var packagesRules   = [];

  function updateQuotationTotals(quotationId, options){
    options = options || {paymentGroup:1 , updateDetails: true};
    return getQuotationTotals(quotationId, options)
      .then(function(totals){
        
        if(options && options.updateParams){
          totals = _.extend(totals, options.updateParams);
        }
        
        totals.bigticketMaxPercentage = getBigticketMaxPercentage(totals.subtotal);

        return Quotation.update({id:quotationId}, totals);
      });
  }

  function getQuotationTotals(quotationId, options){
    var quotationAux = false;
    options = options || {paymentGroup:1 , updateDetails: true};

    return getPromosByStore(options.currentStore)
      .then(function(promos){
        storePromotions = promos;
        return Quotation.findOne({id:quotationId}).populate('Details');
      })
      .then(function(quotation){
        quotationAux = quotation; 
        var packagesIds = getQuotationPackagesIds(quotation.Details);
        if(packagesIds.length > 0){
          return [
            getPackagesByStore(options.currentStore),
            ProductGroup.find({id:packagesIds})
              .populate('PackageRules')
          ];
        }
        return [ [], false ];
      })
      .spread(function(storePackagesFound, promotionPackages){
        storePackages = storePackagesFound;
        packagesRules = getAllPackagesRules(promotionPackages, quotationAux.Details);
        return processQuotationDetails(quotationAux, options);
      })
      .then(function(processedDetails){
        var totals = {
          subtotal:0,
          total:0,
          discount:0,
          totalProducts: 0,
          paymentGroup: options.paymentGroup
        };
        processedDetails.forEach(function(pd){
          totals.total         += pd.total;
          totals.subtotal      += pd.subtotal;
          totals.discount      += (pd.subtotal - pd.total);
          totals.totalProducts += pd.quantity;
        });
        return totals;
      });
  }

  function getPromosByStore(storeId){
    var currentDate = new Date();
    var queryPromos = Search.getPromotionsQuery();
    return Store.findOne({id:storeId})
      .populate('Promotions', queryPromos)
      .then(function(store){
        return store.Promotions;
      });
  }

  function getQuotationPackagesIds(details){
    var packages = [];
    for (var i=0;i<details.length;i++){
      if(details[i].PromotionPackage){
        packages.push( details[i].PromotionPackage ) ;
      }
    }
    return _.uniq(packages);
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

  function getAllPackagesRules(promotionPackages, details){
    var filteredPackages = filterPromotionPackages(promotionPackages, details);
    var rules             = [];
    for(var i=0;i<filteredPackages.length;i++){
      rules = rules.concat(filteredPackages[i].PackageRules);
    }
    return rules;
  }

  function filterPromotionPackages(promotionPackages, details){
    var filtered = [];
    for(var i=0;i<promotionPackages.length;i++){
      if(isValidPromotionPackage(promotionPackages[i], details)){
        filtered.push(promotionPackages[i]);
      }
    }
    return filtered;
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

  function isAStorePackage(promotionPackageId){
    return _.findWhere(storePackages, {id: promotionPackageId});
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

  //@param quotation: 
  //  Populated with Array of objects from model Detail
  //  Every detail must contain a Product object populated
  function processQuotationDetails(quotation, options){
    options = options || {paymentGroup:1};
    var details  = quotation.Details || [];
    var processedDetails = details.map(function(detail){
      return getDetailTotals(detail, quotation, options);
    });
    return Promise.all(processedDetails)
      .then(function(pDetails){
        if(options.updateDetails){
          return updateDetails(pDetails);
        }else{
          return pDetails;
        }
      });
  }

  function getUnitPriceWithDiscount(unitPrice,discountPercent){
    var result = unitPrice - ( ( unitPrice / 100) * discountPercent );
    return result;
  }

  function getEwalletEntryByDetail(options){
    var ewalletEntry = 0;
    if(options.Promotion && !options.Promotion.PromotionPackage){
      var paymentGroup = options.paymentGroup || 1;
      var eKey = paymentGroup - 1;
      var ewallet = options.Promotion[ EWALLET_KEYS[eKey] ];
      var ewalletType = options.Promotion[ EWALLET_TYPES_KEYS[eKey] ];
      if(ewalletType == 'ammount'){
        ewalletEntry = options.total - ewallet;
      }else{
        ewalletEntry = ( options.total / 100) * ewallet;
      }
    }
    return ewalletEntry;
  }  

  //@params: detail Object from model Detail
  //Must contain a Product object populated
  function getDetailTotals(detail, quotation, options){
    options = options || {};
    paymentGroup = options.paymentGroup || 1;
    var subTotal = 0;
    var total    = 0;
    var productId   = detail.Product;
    var quantity    = detail.quantity;
    var currentDate = new Date();
    var queryPromos = Search.getPromotionsQuery();
    return Product.findOne({id:productId})
      .populate('Promotions', queryPromos)
      .then(function(product){
        var mainPromo = getProductMainPromo(product, quantity);
        var unitPrice = product.Price;
        var discountKey = getDiscountKey(options.paymentGroup);
        var discountPercent = mainPromo ? mainPromo[discountKey] : 0;
        var unitPriceWithDiscount = getUnitPriceWithDiscount(unitPrice, discountPercent);
        var subtotal = quantity * unitPrice;
        var total = quantity * unitPriceWithDiscount;
        var discount = total - subtotal;
        var ewallet = getEwalletEntryByDetail({
          Promotion: mainPromo,
          paymentGroup: options.paymentGroup,
          total: total
        });
        var detailTotals = {
          id: detail.id,
          unitPrice: unitPrice,
          unitPriceWithDiscount: unitPriceWithDiscount,
          discountPercent: discountPercent,
          discountKey: discountKey, //Payment group discountKey
          subtotal: subtotal,
          total:total,
          paymentGroup: options.paymentGroup,
          quantity: quantity,
          discount: discount,
          ewallet: ewallet,
          bigticketDiscountPercentage: getQuotationBigticketPercentage(quotation),
          isFreeSale: isFreeSaleProduct(product),
          PromotionPackageApplied: null
        };

        if(mainPromo.id && !mainPromo.PromotionPackage){
          detailTotals.Promotion = mainPromo.id;
        }
        else if(mainPromo.PromotionPackage){
          detailTotals.PromotionPackageApplied = mainPromo.PromotionPackage;
        }
        return detailTotals;
      });
  }

  function getQuotationBigticketPercentage(quotation){
    var percentage = 0;
    if(quotation.bigticketPercentage && 
      (quotation.bigticketPercentage < getBigticketMaxPercentage(quotation.subtotal))
    ){
       percentage = quotation.bigticketPercentage;
    }

    return percentage;
  }

  function isFreeSaleProduct(product){
    if(product){
      return product.freeSale && product.freeSaleStock > 0;
    }
    return false;
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

  function isPackageDiscountApplied(){
    return _.findWhere(packagesRules, {discountApplied:true});
  }

  function matchWithStorePromotions(productPromotions){
    var promotions = productPromotions.filter(function(promotion){
      return _.findWhere(storePromotions, {id:promotion.id});
    });  
    return promotions;
  }

  function getDetailPackageRule(productId, quantity){
    if(packagesRules.length > 0){
      var query = {
        Product : productId,
        quantity: quantity
      };
      var detailRuleMatch = false;
      var matches         = _.where(packagesRules, query);
      matches = matches.filter(function(m){
        return !m.validated;
      });
      detailRuleMatch = matches[0] || false;
      if( detailRuleMatch && !detailRuleMatch.validated){    
        detailRuleMatch.validated = true;
        return detailRuleMatch;
      }
    }
    return false;
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

    if(productPromotions[indexMaxPromo] && 
      productPromotions[indexMaxPromo].PromotionPackage
    ){
      productPromotions[indexMaxPromo].discountApplied = true;
    }

    return productPromotions[indexMaxPromo] || false;
  }

  function getDiscountKey(group){
    return DISCOUNT_KEYS[group-1];
  }


  function isValidPackageRule(rule, details){
    var isValidRule = _.find(details, function(detail){
      if(detail.Product === rule.Product && detail.quantity === rule.quantity && !detail.validated){
        detail.validated = true;
        return true;
      }
      return false;
    });
    return isValidRule;  
  }

  return {
    getQuotationTotals: getQuotationTotals,
    updateQuotationTotals: updateQuotationTotals
  };
}


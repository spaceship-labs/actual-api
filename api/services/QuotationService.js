const Promise = require('bluebird');
const _ = require('underscore');
const assign = require('object-assign');
const moment = require('moment');
const ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;
const DISCOUNT_KEYS = [
  'discountPg1',
  'discountPg2',
  'discountPg3',
  'discountPg4',
  'discountPg5',
];

const DEFAULT_QUOTATION_TOTALS = {
  subtotal: 0,
  subtotal2: 0,
  total: 0,
  discount: 0,
  totalProducts: 0,
  paymentGroup: 1,
  immediateDelivery: false,
  ShopDelivery: false,
};

const statusTypes = {
  CANCELED: 'canceled',
};

module.exports = {
  Calculator,
  updateQuotationToLatestData,
  getCountByUser,
  getTotalsByUser,
  getGroupByQuotationPayments,
  statusTypes,
  DISCOUNT_KEYS
};

function getGroupByQuotationPayments(payments = []) {
  var group = 1;
  const auxPayments = payments.filter(function(payment) {
    return !PaymentService.isCanceled(payment);
  })

  if(auxPayments.length > 0){
    group = _.last(auxPayments).group;
  }
  return group;
}

async function updateQuotationToLatestData(quotationId, userId, options){
  var params = {
    paymentGroup: options.paymentGroup || 1,
    updateDetails: true,
    currentStoreId: options.currentStoreId,
    isEmptyQuotation: options.isEmptyQuotation,
  };

  const findCriteria = { _id: new ObjectId(quotationId) };

  if (options.isEmptyQuotation) {
    return Common.nativeUpdateOne(
      findCriteria,
      DEFAULT_QUOTATION_TOTALS,
      Quotation
    );
  }

  const quotation = await Common.nativeFindOne(findCriteria, Quotation);
  if (!quotation) {
    throw new Error('Cotización no encontrada');
  }
  const calculator = Calculator();
  return calculator.updateQuotationTotals(quotationId, params);
}

function Calculator() {
  //Calculator variables used on every instance of Calculator
  //They are used acrossed differente functions in Calculator
  var loadedActivePromotions = [];
  var loadedStorePackages = [];
  var loadedPackagesRules = [];

  async function updateQuotationTotals(
    quotationId,
    options = { paymentGroup: 1, updateDetails: true }
  ) {
    options = _.extend(options, {
      financingTotals: true,
    });

    const findCriteria = { _id: new ObjectId(quotationId) };

    if (options.isEmptyQuotation) {
      return Common.nativeUpdateOne(
        findCriteria,
        DEFAULT_QUOTATION_TOTALS,
        Quotation
      );
    }

    var totals = await getQuotationTotals(quotationId, options);
    if (options && options.updateParams) {
      totals = _.extend(totals, options.updateParams);
    }
    return Common.nativeUpdateOne(findCriteria, totals, Quotation);
  }

  async function getQuotationTotals(
    quotationId,
    options = { paymentGroup: 1, updateDetails: true }
  ) {
    const promos = await getActivePromos();
    setLoadedActivePromotions(promos);

    const quotation = await Quotation.findOne({id:quotationId}).populate('Details').populate('Payments').populate('Store');
      const details = quotation.Details;
    const sumOfDetailsWithoutDiscountAtelier = _.reduce(details, function (acc, detail) {
      return Number(acc) + (Number(detail.unitPrice) * Number(detail.quantity));
    }, 0)
    console.log({ sumOfDetailsWithoutDiscount });

    const packagesIds = getQuotationDetailsPackagesIds(details);

    if (packagesIds.length > 0) {
      const storePackages = await getPackagesByStoreId(options.currentStoreId);
      setLoadedStorePackages(storePackages);
      const promotionPackages = await ProductGroup.find({
        id: packagesIds,
      }).populate('PackageRules');
      setLoadedPackagesRules(getAllPackagesRules(promotionPackages, details));
    }

    var processedDetails = await processQuotationDetails(details, options);
    var totals = sumProcessedDetails(processedDetails, options);
    console.log({ totals })

    const ammountPaidPg1 = quotation.ammountPaidPg1 || 0;

    if (ammountPaidPg1 > 0 && options.financingTotals) {
      processedDetails = mapDetailsWithFinancingCost(
        processedDetails,
        ammountPaidPg1,
        totals
      );
      totals = sumProcessedDetails(processedDetails, options);

      if (options.updateDetails) {
        await updateDetails(processedDetails);
      }
    }

    totals = {
      ...totals,
      paymentGroup: getGroupByQuotationPayments(quotation.Payments),
    };
        

    // Descuentos predefinidos
    if(promos.length > 0){
      // Por rangos de monto

      var isPredefinedDiscount = itIsPredefinedDiscount(promos[0]);
      var isProductTypeDiscount = itIsProductTypeDiscount(promos[0]);
      
      if (isPredefinedDiscount === true) {
        console.log("------------------------------\n  USING PREDEFINED DISCOUNT\n------------------------------");
        var discountRanges = [];
        var discountRangesPercent = [];
        for (var key in promos[0]) {
          if (
            key.indexOf("discountRange") === 0 && /\d$/.test(key)
          ) {
            //discountRanges[key] = promos[0][key];
            if (!key.includes("Percent")) {
              discountRanges.push(promos[0][key]);
            }
          }
          if (
            key.indexOf("discountRangePercent") === 0 && /\d$/.test(key)
          ) {
            //discountRangesPercent[key] = promos[0][key];
            discountRangesPercent.push(promos[0][key]);
          }
        }
        var discountRangesWithPercent = {};
        for (var i = 0; i < discountRanges.length; i++) {
          var key = discountRanges[i];
          var value = discountRangesPercent[i];
          discountRangesWithPercent[key] = value;
          
        }
        console.log("\n\ndiscountRangesWithPercent",discountRangesWithPercent);
        var keys = Object.keys(discountRangesWithPercent);
        var closestNumber = findClosestNumber(totals.total, keys);
        var discount = discountRangesWithPercent[closestNumber];

        if(discount && discount > 0 && discount != null && discount != undefined){
          totals.discount = sumOfDetailsWithoutDiscount / 100 * discount;
          totals.total = totals.total - totals.discount;
        }

      }else if(isProductTypeDiscount === true) {
        // Por tipo de producto
        console.log("--------------------------------\n  USING PRODUCT TYPE DISCOUNT\n--------------------------------");
        options = _.extend(options, {
          productTypeDiscount: true,
        });
        processedDetails = await processQuotationDetails(details, options);

      }
      console.log({totals})
      /* if (promos.length > 0  && promos[0].discountRange1) {
        if (promos[0].discountRange1 && 
            promos[0].discountRange1 > 0 && 
            promos[0].discountRange1 != null && 
            sumOfDetailsWithoutDiscount > promos[0].discountRange1 && 
            promos[0].discountRange1 > 0 && 
            promos[0].discountRange1 != null
          ) {
          totals.discount = sumOfDetailsWithoutDiscount / 100 * promos[0].discountRangePercent1
          totals.total = totals.total - totals.discount
          totals.totalPg1 = totals.total - totals.discount
        }
      } */
    }

    return totals;
  }

  function mapDetailsWithFinancingCost(
    details,
    ammountPaidPg1,
    quotationPlainTotals
  ) {
    return details.map(function(detail) {
      var proportionalPaymentPg1 =
        detail.totalPg1 / quotationPlainTotals.totalPg1 * ammountPaidPg1;
      var proportionalPayment =
        detail.total / quotationPlainTotals.total * ammountPaidPg1;

      var detailRemainingPg1 = detail.totalPg1 - proportionalPaymentPg1;
      var detailRemaining =
        (1 + detail.financingCostPercentage) * detailRemainingPg1;

      detail.originalDiscountPercent = _.clone(detail.discountPercent);
      detail.total = proportionalPayment + detailRemaining;
      detail.discount = detail.total - detail.subtotal;
      detail.discountPercent = 100 - detail.total / detail.subtotal * 100;
      detail.unitPriceWithDiscount = calculateAfterDiscount(
        detail.unitPrice,
        detail.discountPercent
      );
      detail.discountPercentPromos = detail.discountPercentPromos;
      return detail;
    });
  }

  function sumProcessedDetails(processedDetails, options) {
    var defaultTotals = {
      subtotal: 0,
      subtotal2: 0,
      total: 0,
      totalPg1: 0,
      discount: 0,
      totalProducts: 0,
    };

    var totals = processedDetails.reduce(function(acum, detail) {
      acum.totalPg1 += detail.totalPg1;
      acum.total += detail.total;
      acum.subtotal += detail.subtotal;
      acum.subtotal2 += detail.subtotal2;
      acum.discount += detail.subtotal - detail.total;
      acum.totalProducts += detail.quantity;
      return acum;
    }, defaultTotals);

    totals = {
      ...totals,
      paymentGroup: options.paymentGroup,
      immediateDelivery: processedDetails.every(function(detail) {
        return detail.immediateDelivery && !detail.isSRService;
      }),
      ShopDelivery: processedDetails.every(function(detail) {
        return detail.ShopDelivery;
      }),
      WeekendDelivery: processedDetails.every(function(detail) {
        return detail.WeekendDelivery;
      }),
      appliesClientDiscount: _.some(processedDetails, function(detail) {
        return detail.clientDiscountReference;
      }),
      financingCostPercentage: calculateFinancingCostPercentage(
        totals.totalPg1,
        totals.total
      ),
    };
    return totals;
  }

  async function getActivePromos() {
    var queryPromos = Search.getPromotionsQuery();
    const promos = await Promotion.find(queryPromos);
    return promos;
  }

  function getQuotationDetailsPackagesIds(details) {
    var ids = details.reduce(function(acum, detail) {
      if (detail.PromotionPackage) {
        acum.push(detail.PromotionPackage);
      }
      return acum;
    }, []);
    return _.unique(ids);
  }

  async function getPackagesByStoreId(storeId) {
    const queryPromos = Search.getPromotionsQuery();
    const store = await Store.findOne({ id: storeId }).populate(
      'PromotionPackages',
      queryPromos
    );
    if (store) {
      return store.PromotionPackages;
    }
    return [];
  }

  function getAllPackagesRules(promotionPackages, details) {
    var filteredPackages = filterPromotionPackages(promotionPackages, details);
    var rules = filteredPackages.reduce(function(acum, package) {
      acum = acum.concat(package.PackageRules);
      return acum;
    }, []);
    return rules;
  }

  function filterPromotionPackages(promotionPackages, details) {
    return promotionPackages.filter(function(package) {
      return isValidPromotionPackage(package, details);
    });
  }

  function isValidPromotionPackage(promotionPackage, details) {
    return (
      promotionPackage &&
      promotionPackage.id &&
      isAStorePackage(promotionPackage.id) &&
      validatePackageRules(promotionPackage.PackageRules, details)
    );
  }

  function isAStorePackage(promotionPackageId) {
    return _.findWhere(loadedStorePackages, { id: promotionPackageId })
      ? true
      : false;
  }

  function validatePackageRules(rules, details) {
    var validFlag = true;
    var rulesValidated = 0;
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      if (!isValidPackageRule(rule, details)) {
        validFlag = false;
      }
      rulesValidated++;
    }
    if (rulesValidated < rules.length) {
      validFlag = false;
    }
    return validFlag;
  }

  //@param details {Array <QuotationDetail>}:
  //Every detail must contain a Product object populated
  function processQuotationDetails(details, options = { paymentGroup: 1 }) {
    return Promise.mapSeries(details, function(detail) {
      return getDetailTotals(detail, options);
    }).then(function(pDetails) {
      if (options.updateDetails) {
        return updateDetails(pDetails);
      } else {
        return pDetails;
      }
    });
  }

  function calculateAfterDiscount(amount, discountPercentage) {
    var result = amount - amount / 100 * discountPercentage;
    return result;
  }


  const calculateEwalletAmount = (group, total, promotion) => {
    if (promotion[`ewalletTypePg${group}`] === 'ammount') {
      return promotion[`ewalletPg${group}`];
    } else if (promotion[`ewalletTypePg${group}`] === 'percentage'){
      return total * (promotion[`ewalletPg${group}`] / 100);
    }
  }

  //@params: detail Object from model Detail
  async function getDetailTotals(detail, options = {}) {
    const productId = detail.Product;
    const quantity = detail.quantity;
    const quotationId = detail.Quotation;
    const product = await Product.findOne({ id: productId }).populate("Categories");;
    const mainPromo = await getProductMainPromo(product, quantity, quotationId);
    const productCategories = _.extend(product.Categories);
    delete productCategories.add;
    delete productCategories.remove;    const {paymentGroup} = options;
    const unitPrice = product.Price;
    const discountKey = getDiscountKeyByGroup(paymentGroup);
    const discountPercent = mainPromo ? mainPromo[discountKey] : 0;
    const discountPercentPromos = discountPercent;
    const unitPriceWithDiscount = calculateAfterDiscount(
      unitPrice,
      discountPercent
    );
    const subtotal = quantity * unitPrice;
    const subtotal2 = quantity * unitPriceWithDiscount;
    const total = quantity * unitPriceWithDiscount;
    var totalPg1 = total;
    var financingCostPercentage = 0;
    const discountName = mainPromo
      ? getPromotionOrPackageName(mainPromo)
      : null;
    const discount = total - subtotal;

    const ewallet = calculateEwalletAmount(paymentGroup, total, mainPromo);

    //Calculate financing cost
    if (mainPromo) {
      const PAYMENT_GROUP_1 = 1;
      const _discountKey = getDiscountKeyByGroup(PAYMENT_GROUP_1);
      const _discountPercent = mainPromo[_discountKey];
      const _unitPriceWithDiscount = calculateAfterDiscount(
        unitPrice,
        _discountPercent
      );
      totalPg1 = _unitPriceWithDiscount * quantity;
      financingCostPercentage = calculateFinancingCostPercentage(
        totalPg1,
        total
      );
      if (isNaN(financingCostPercentage)) {
        financingCostPercentage = 0;
      }
    }

    var detailTotals = {
      id: detail.id,
      discount,
      discountKey, //Payment group discountKey
      discountPercentPromos, //discount without BT or FF
      discountPercent,
      discountName,
      ewallet,
      isFreeSale: StockService.isFreeSaleProduct(product),
      paymentGroup: paymentGroup,
      PromotionPackageApplied: null,
      quantity,
      subtotal,
      subtotal2,
      total,
      totalPg1,
      financingCostPercentage,
      unitPrice,
      unitPriceWithDiscount,
      immediateDelivery: Shipping.isDateImmediateDelivery(
        detail.shipDate,
        detail.immediateDelivery
      ),
      ShopDelivery: Shipping.isDateShopDelivery(
        detail.ShopDelivery
      ),
      WeekendDelivery: Shipping.isDateWeekend(
        detail.WeekendDelivery
      ),
      isSRService: ProductService.isSRService(product),
      productCategories,
    };

    if (
      mainPromo.id &&
      !mainPromo.PromotionPackage &&
      !mainPromo.clientDiscountReference
    ) {
      detailTotals.Promotion = mainPromo.id;
    } else if (mainPromo.PromotionPackage) {
      mainPromo.discountApplied = true;
      detailTotals.PromotionPackageApplied = mainPromo.PromotionPackage;
    } else if (mainPromo.clientDiscountReference) {
      detailTotals.clientDiscountReference = mainPromo.clientDiscountReference;
    }
    if ( options.productTypeDiscount == true ) {
      var promo = await getActivePromos();
      productDiscounts = promo[0].productTypeDiscounts;
      for ( elem of productDiscounts ){
        var percentage = elem.value;
        var category = elem.option;
        for ( i = 0; i <= productCategories.length-1; i++ ){
          if( category.toLowerCase() === productCategories[i].Handle.toLowerCase() ) {
            var detailTmp = _.extend(detailTotals);
            detailTmp.discountPercent = percentage;
            detailTmp.discountPercentPromos = percentage;
            detailTmp.discount = detailTmp.subtotal / 100 * percentage;
            detailTmp.unitPriceWithDiscount = detailTmp.unitPrice - detailTmp.discount;
            detailTmp.subtotal2 = detailTmp.subtotal - detailTmp.discount;
            detailTmp.total = detailTmp.subtotal2;
            detailTmp.subtotal = detailTmp.quantity * detailTmp.unitPrice;
            detailTmp.subtotal2 = detailTmp.quantity * detailTmp.unitPriceWithDiscount;
            detailTmp.total = detailTmp.quantity * detailTmp.unitPriceWithDiscount;
            if ( detailTotals < detailTmp ){
              detailTotals = _.extend(detailTmp);
              console.log("\x1b[32m");
              console.log(detailTotals);
              console.log("\x1b[0m");
            }
          }
        }
      }
    }

    delete detailTotals.productCategories;
    return detailTotals;
  }

  function calculateFinancingCostPercentage(totalPg1, total) {
    if (totalPg1 === 0 && total === 0) return 0;
    return (total - totalPg1) / totalPg1;
  }

  function getPromotionOrPackageName(promotionOrPackage) {
    var promotionFound = _.findWhere(loadedActivePromotions, {
      id: promotionOrPackage.id,
    });
    if (promotionFound) {
      return promotionOrPackage.publicName;
    }

    var packageFound = _.findWhere(loadedStorePackages, {
      id: promotionOrPackage.PromotionPackage,
    });
    if (packageFound) {
      return packageFound.Name;
    }

    return null;
  }

  //@params product <Product>
  async function getProductMainPromo(product, quantity, quotationId) {
    var packageRule = getDetailPackageRule(product.id, quantity);
    var promotions = await PromotionService.getProductActivePromotions(
      product,
      loadedActivePromotions,
      quotationId
    );
    if (packageRule) {
      return packageRule;
    }
    const mainPromo = await PromotionService.getPromotionWithHighestDiscount(
      promotions
    );
    return mainPromo;
  }

  function setLoadedPackagesRules(packagesRules) {
    loadedPackagesRules = packagesRules;
  }

  function setLoadedActivePromotions(promotions) {
    loadedActivePromotions = promotions;
  }

  function setLoadedStorePackages(packages) {
    loadedStorePackages = packages;
  }

  function getDetailPackageRule(productId, quantity) {
    if (loadedPackagesRules.length > 0) {
      var query = {
        Product: productId,
        quantity: quantity,
      };
      var packageRuleMatch = false;
      var matches = _.where(loadedPackagesRules, query);
      var matchesNotValidated = matches.filter(function(m) {
        return !m.validated;
      });
      packageRuleMatch = matchesNotValidated[0] || false;

      if (packageRuleMatch && !packageRuleMatch.validated) {
        packageRuleMatch.validated = true;
        return packageRuleMatch;
      }
    }
    return false;
  }

  function updateDetails(details) {
    return Promise.mapSeries(details, function(d) {
      return updateDetail(d).then(function(updated) {
        if (updated && updated.length > 0) {
          return updated[0];
        }
        return null;
      });
    });
  }

  function updateDetail(detail) {
    return QuotationDetail.update({ id: detail.id }, detail);
  }

  function getDiscountKeyByGroup(group) {
    return DISCOUNT_KEYS[group - 1];
  }

  function isValidPackageRule(rule, details) {
    var validRule = _.find(details, function(detail) {
      if (
        detail.Product === rule.Product &&
        detail.quantity === rule.quantity &&
        !detail.validated
      ) {
        detail.validated = true;
        return true;
      }
      return false;
    });
    return validRule ? true : false;
  }

  return {
    getQuotationTotals,
    updateQuotationTotals,
    sumProcessedDetails,
    getQuotationDetailsPackagesIds,
    getDetailPackageRule,
    getDiscountKeyByGroup,
    getPromotionOrPackageName,
    getAllPackagesRules,
    filterPromotionPackages,
    isValidPackageRule,
    isAStorePackage,
    validatePackageRules,
    isValidPromotionPackage,
    calculateFinancingCostPercentage,
    calculateAfterDiscount,
    setLoadedPackagesRules,
    setLoadedActivePromotions,
    setLoadedStorePackages,
  };
}

function getTotalsByUser(options) {
  var userId = options.userId;
  var todayDate = moment()
    .endOf('day')
    .toDate();
  var isClosed = options.isClosed;

  if (_.isUndefined(options.endDate)) {
    options.endDate = todayDate;
  }

  var startDate = options.startDate;
  var endDate = options.endDate;
  var dateField = options.dateField || 'createdAt';

  var queryUntilToday = { User: userId };
  queryUntilToday[dateField] = {
    '<=': todayDate,
  };

  var queryByDateRange = { User: userId };
  queryByDateRange[dateField] = {};

  if (startDate) {
    startDate = moment(startDate)
      .startOf('day')
      .toDate();
    queryUntilToday[dateField] = assign(queryUntilToday[dateField], {
      '>=': startDate,
    });
    queryByDateRange[dateField] = assign(queryByDateRange[dateField], {
      '>=': startDate,
    });
  }

  if (endDate) {
    endDate = moment(endDate)
      .endOf('day')
      .toDate();
    queryByDateRange[dateField] = assign(queryByDateRange[dateField], {
      '<=': endDate,
    });
  }

  if (_.isEmpty(queryByDateRange[dateField])) {
    delete queryByDateRange[dateField];
  }

  var queryAllByDateRange = _.clone(queryByDateRange);

  if (isClosed) {
    queryUntilToday.isClosed = isClosed;
    queryByDateRange.isClosed = isClosed;
  }

  //sails.log.info('query untilToday', queryUntilToday);
  //sails.log.info('queryByDateRange', queryByDateRange);
  //sails.log.info('queryAllByDateRange', queryAllByDateRange);

  var props = {
    totalUntilToday: Quotation.find(queryUntilToday).sum('total'),
    totalByDateRange: Quotation.find(queryByDateRange).sum('total'),
    totalByDateRangeAll: Quotation.find(queryAllByDateRange).sum('total'),
  };

  return Promise.props(props).then(function(result) {
    var resultUntilToday = result.totalUntilToday[0] || {};
    var resultByDateRange = result.totalByDateRange[0] || {};
    var resultAllByDateRange = result.totalByDateRangeAll[0] || {};

    var totalUntilToday = resultUntilToday.total || 0;
    var totalByDateRange = resultByDateRange.total || 0;
    var totalByDateRangeAll = resultAllByDateRange.total || 0;

    return {
      untilToday: totalUntilToday,
      byDateRange: totalByDateRange,
      allByDateRange: totalByDateRangeAll,
    };
  });
}

function getCountByUser(options) {
  var userId = options.userId;
  var todayDate = moment()
    .endOf('day')
    .toDate();
  var isClosed = options.isClosed;

  if (_.isUndefined(options.endDate)) {
    options.endDate = todayDate;
  }

  var startDate = options.startDate;
  var endDate = options.endDate;
  var dateField = options.dateField || 'createdAt';

  var queryUntilToday = { User: userId };
  queryUntilToday[dateField] = {
    '<=': todayDate,
  };

  var queryByDateRange = { User: userId };
  queryByDateRange[dateField] = {};

  if (startDate) {
    startDate = moment(startDate)
      .startOf('day')
      .toDate();
    queryUntilToday[dateField] = assign(queryUntilToday[dateField], {
      '>=': startDate,
    });
    queryByDateRange[dateField] = assign(queryByDateRange[dateField], {
      '>=': startDate,
    });
  }

  if (endDate) {
    endDate = moment(endDate)
      .endOf('day')
      .toDate();
    queryByDateRange[dateField] = assign(queryByDateRange[dateField], {
      '<=': endDate,
    });
  }

  if (_.isEmpty(queryByDateRange[dateField])) {
    delete queryByDateRange[dateField];
  }

  var queryAllByDateRange = _.clone(queryByDateRange);

  if(isClosed){
    queryUntilToday.isClosed = isClosed;
    queryByDateRange.isClosed = isClosed;
  }

  return Promise.props({
    countUntilToday: Quotation.count(queryUntilToday),
    countByDateRange: Quotation.count(queryByDateRange),
    countAllByDateRange: Quotation.count(queryAllByDateRange),
  }).then(function(result) {
    return {
      untilToday: result.countUntilToday,
      byDateRange: result.countByDateRange,
      allByDateRange: result.countAllByDateRange,
    };
  });

  function findClosestNumber(target, numbers) {
    var closestNumber = null;
    var minDifference = Infinity;
  
    for (var i = 0; i < numbers.length; i++) {
      var difference = target - parseInt(numbers[i]);
      if (difference >= 0 && difference < minDifference && numbers[i] < target) {
        closestNumber = numbers[i];
        minDifference = difference;
      }
    }
  
    return closestNumber;
  }
  
  function itIsPredefinedDiscount(promo){
    var obj = promo;
    var elements = {};
    for (var key in obj) {
      if (key && key != undefined && key.indexOf("discountRange") === 0 && /\d$/.test(key)) {
        if (key.includes("Percent")) {
          var value = obj[key];
          if (value > 0 && value !== null && value !== 0) {
            elements[key] = value;
          }
        }
      }
    }
    return Object.keys(elements).length > 0 ? true : false;
  }
  
  function itIsProductTypeDiscount(promo){
    var productTypeDiscounts = promo.productTypeDiscounts;
    var isValid = productTypeDiscounts && Array.isArray(productTypeDiscounts) && productTypeDiscounts.length > 0;
    return isValid;
  }
}

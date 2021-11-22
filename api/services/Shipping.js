const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment');
const { ObjectId } = require('sails-mongo/node_modules/mongodb');

const CEDIS_QROO_CODE = '01';
const CEDIS_QROO_ID = '576acfee5280c21ef87ea5b5';
const CEDIS_MERIDA_WHS_CODE = '10';
const STUDIO_MERIDA_WHS_CODE = '11';

module.exports = {
  product: productShipping,
  isDateImmediateDelivery: isDateImmediateDelivery,
  isDateShopDelivery: isDateShopDelivery,
};

async function productShipping(product, storeWarehouse, activeQuotationId) {
  let shippingItems = [];

  const deliveries = await Delivery.find({
    ToCode: storeWarehouse.WhsCode,
    Active: 'Y',
  });
  const companiesCodes = deliveries.map(function(delivery) {
    return delivery.FromCode;
  });
  const stockItemsQuery = {
    ItemCode: product.ItemCode,
    whsCode: companiesCodes,
    OpenCreQty: {
      '>': 0,
    },
  };
  let stockItems = await DatesDelivery.find(stockItemsQuery);
  const pendingProductDetailSum = await getPendingProductDetailsSum(product);
  const stockItemscodes = stockItems.map(function(p) {
    return p.whsCode;
  });
  const whsCodes = await Company.find({ WhsCode: stockItemscodes });

  stockItems = stockItems.map(function(stockItem) {
    //stockItem.company is storeWarehouse id
    stockItem.warehouseId = _.find(whsCodes, function(ci) {
      return ci.WhsCode == stockItem.whsCode;
    }).id;
    return stockItem;
  });

  if (deliveries.length > 0 && stockItems.length > 0) {
    stockItems = filterStockItems(stockItems, deliveries, storeWarehouse.id);
    var shippingPromises = stockItems.map(function(stockItem) {
      return buildShippingItem(
        stockItem,
        deliveries,
        storeWarehouse.id,
        pendingProductDetailSum
      );
    });

    shippingItems = await Promise.all(shippingPromises);
  } else if (StockService.isFreeSaleProduct(product) && deliveries) {
    product.freeSaleDeliveryDays = product.freeSaleDeliveryDays || 0;
    var shipDate = moment()
      .add(product.freeSaleDeliveryDays, 'days')
      .startOf('day')
      .toDate();
    var freeSaleStockItem = {
      whsCode: CEDIS_QROO_CODE,
      OpenCreQty: product.freeSaleStock,
      ItemCode: product.ItemCode,
      warehouseId: CEDIS_QROO_ID,
      ShipDate: shipDate,
    };

    shippingItems = await Promise.all([
      buildShippingItem(
        freeSaleStockItem,
        deliveries,
        storeWarehouse.id,
        pendingProductDetailSum
      ),
    ]);
  } else {
    shippingItems = [];
  }

  if (activeQuotationId) {
    const details = await QuotationDetail.find({
      Quotation: activeQuotationId,
    });
    shippingItems = substractDeliveriesStockByQuotationDetails(
      details,
      shippingItems,
      product.id
    );
  }

  return shippingItems;
}

async function buildShippingItem(
  stockItem,
  deliveries,
  storeWarehouseId,
  pendingProductDetailSum
) {
  const delivery = _.find(deliveries, function(d) {
    return d.FromCode == stockItem.whsCode;
  });

  const productDate = new Date(stockItem.ShipDate);
  const productDays = daysDiff(new Date(), productDate);
  const seasonQuery = getQueryDateRange({}, productDate);

  const season = await Season.findOne(seasonQuery);
  let LOW_SEASON_DAYS; //Original: 7, then 8
  let MAIN_SEASON_DAYS;
  let seasonDays;

  if (isMeridaWhsCode(stockItem.whsCode)) {
    MAIN_SEASON_DAYS = 13; //ORIGINAL 11
    LOW_SEASON_DAYS = 13; // ORIGINAL 10
  } else {
    MAIN_SEASON_DAYS = 6; //10 // ORIGINAL 6
    LOW_SEASON_DAYS = 6; // ORIGINAL 5
  }

  if (season) {
    seasonDays = MAIN_SEASON_DAYS;
  } else {
    seasonDays = LOW_SEASON_DAYS;
  }

  const deliveryDays = (delivery && delivery.Days) || 0;
  let days = productDays + seasonDays + deliveryDays;

  //Product in same store/warehouse
  if (stockItem.whsCode === delivery.ToCode && stockItem.ImmediateDelivery) {
    days = productDays;
  }
  const SHOP_DELIVERY_DAYS = 2;
  if (stockItem.ShopDelivery) {
    days = productDays + SHOP_DELIVERY_DAYS;
  }

  const todayDate = new Date();
  const date = addDays(todayDate, days);
  let available = stockItem.OpenCreQty;

  if (stockItem.whsCode === CEDIS_QROO_CODE) {
    available -= pendingProductDetailSum;
  }

  return {
    available: available,
    days: days,
    date: date,
    productDate: productDate,
    company: storeWarehouseId,
    companyFrom: stockItem.warehouseId,
    itemCode: stockItem.ItemCode,
    ImmediateDelivery: stockItem.ImmediateDelivery || false,
    ShopDelivery: stockItem.ShopDelivery || false,
    PurchaseAfter: stockItem.PurchaseAfter,
    PurchaseDocument: stockItem.PurchaseDocument,
  };
}

function isMeridaWhsCode(whsCode) {
  return (
    whsCode === CEDIS_MERIDA_WHS_CODE || whsCode === STUDIO_MERIDA_WHS_CODE
  );
}

function filterStockItems(stockItems, deliveries, storeWarehouseId) {
  return stockItems.filter(function(stockItem) {
    var delivery = _.find(deliveries, function(delivery) {
      return delivery.FromCode == stockItem.whsCode;
    });

    //Only use immediate delivery stock items, when from and to warehouses
    //are the same
    if (stockItem.ImmediateDelivery) {
      return stockItem.whsCode === delivery.ToCode;
    }

    return true;
  });
}

function getImmediateStockItem(stockItems, deliveries) {
  return _.find(stockItems, function(stockItem) {
    var delivery = _.find(deliveries, function(delivery) {
      return delivery.FromCode == stockItem.whsCode;
    });

    return stockItem.whsCode === delivery.ToCode; //&& stockItem.ImmediateDelivery;
  });
}

function getQueryDateRange(query, date) {
  var date = new Date(date);
  return _.assign(query, {
    StartDate: {
      '<=': date,
    },
    EndDate: {
      '>=': date,
    },
    Active: 'Y',
  });
}

function addDays(date, days) {
  date = new Date(date);
  date.setDate(date.getDate() + days);
  return date;
}

function daysDiff(a, b) {
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function isDateImmediateDelivery(shipDate, immediateDeliveryFlag) {
  var FORMAT = 'D/M/YYYY';
  var currentDate = moment().format(FORMAT);
  shipDate = moment(shipDate).format(FORMAT);
  return currentDate === shipDate && immediateDeliveryFlag;
}
function isDateShopDelivery(shopDeliveryFlag) {
  return shopDeliveryFlag;
}

function substractDeliveriesStockByQuotationDetails(
  quotationDetails,
  shippingItems,
  productId
) {
  let details = quotationDetails.slice();
  details = details.filter(function(detail) {
    return detail.Product === productId;
  });

  return shippingItems.map(function(item) {
    for (var j = 0; j < details.length; j++) {
      if (
        details[j].shipCompany === item.company &&
        details[j].shipCompanyFrom === item.companyFrom
      ) {
        item.available -= details[j].quantity;
      }
    }
    return item;
  });
}

function getPendingProductDetailsSum(product) {
  var match = {
    Product: ObjectId(product.id),
    inSapWriteProgress: true,
  };

  var group = {
    _id: '$Product',
    pendingStock: { $sum: '$quantity' },
  };

  return new Promise(function(resolve, reject) {
    OrderDetailWeb.native(function(err, collection) {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      collection.aggregate([{ $match: match }, { $group: group }], function(
        _err,
        results
      ) {
        if (err) {
          console.log('_err', _err);
          return reject(_err);
        }

        if (results && results.length > 0) {
          return resolve(results[0].pendingStock);
        } else {
          return resolve(0);
        }
      });
    });
  });
}

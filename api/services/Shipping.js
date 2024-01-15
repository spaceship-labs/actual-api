const Promise = require('bluebird');
const _ = require('underscore');
const moment = require('moment');
const { ObjectId } = require('sails-mongo/node_modules/mongodb');

const CEDIS_QROO_CODE = '01';
const CEDIS_QROO_ID = '576acfee5280c21ef87ea5b5';
const ISLA_MERIDA_ID = '5fa22aa1d4a59d093dfed967';
const STUDIO_MERIDA_ID = '576acfee5280c21ef87ea5bc';
const CEDIS_MERIDA_WHS_CODE = '10';
const STUDIO_MERIDA_WHS_CODE = '11';
const ISLA_MERIDA_WHS_CODE = '22';

module.exports = {
  product: productShipping,
  isDateImmediateDelivery: isDateImmediateDelivery,
  isDateShopDelivery: isDateShopDelivery,
  isDateWeekend: isDateWeekend,
};

async function productShipping(product, storeWarehouse, activeQuotationId) {
  let shippingItems = [];
  const notValidShopDelivery = ["83", "10", "11", "22"]

  const deliveries = await Delivery.find({
    ToCode: storeWarehouse.WhsCode,
    Active: 'Y',
  });
  const companiesCodes = deliveries.map(function (delivery) {
    return delivery.FromCode;
  });
  let stockItemsQuery = {
    ItemCode: product.ItemCode,
    whsCode: companiesCodes,
    OpenCreQty: {
      '>': 0,
    },
  };
  if (notValidShopDelivery.includes(storeWarehouse.WhsCode)) {
    stockItemsQuery = {
      ItemCode: product.ItemCode,
      whsCode: companiesCodes,
      OpenCreQty: {
        '>': 0,
      },
      ShopDelivery: false,
      WeekendDelivery: false
    }
  }
  let stockItems = await DatesDelivery.find(stockItemsQuery);
  const pendingProductDetailSum = await getPendingProductDetailsSum(product);
  const stockItemscodes = stockItems.map(function (p) {
    return p.whsCode;
  });

  const whsCodes = await Company.find({ WhsCode: stockItemscodes });

  stockItems = stockItems.map(function (stockItem) {
    //stockItem.company is storeWarehouse id
    stockItem.warehouseId = _.find(whsCodes, function (ci) {
      return ci.WhsCode == stockItem.whsCode;
    }).id;
    return stockItem;
  });

  if (deliveries.length > 0 && stockItems.length > 0) {
    stockItems = filterStockItems(stockItems, deliveries, storeWarehouse.id);
    var shippingPromises = stockItems.map(function (stockItem) {
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
  const delivery = _.find(deliveries, function (d) {
    return d.FromCode == stockItem.whsCode;
  });

  const productDate = new Date(stockItem.ShipDate);
  const productDays = daysDiff(new Date(), productDate);
  const seasonQuery = getQueryDateRange({}, productDate);
  const QrooStores = ["02", "03", "05", "82", "152"]
  const fromQrooStores = ["01", "02", "03", "05", "82", "152"]

  const season = await Season.findOne(seasonQuery);
  let LOW_SEASON_DAYS; //Original: 7, then 8
  let MAIN_SEASON_DAYS;
  let seasonDays;

  if (fromQrooStores.includes(stockItem.whsCode)) {
    let toCode = await Company.findOne(storeWarehouseId);
    if (QrooStores.includes(toCode.WhsCode)) {
      // de Qroo a Qroo 3 o 5 dias
      let WEEKEND_DELIVERY_DAYS = 5;
      var currentDate = moment().startOf('date');
      if (currentDate.day() >= 0 && currentDate.day() <= 4) {
        WEEKEND_DELIVERY_DAYS -= 2;
      }
      seasonDays = WEEKEND_DELIVERY_DAYS;

      // Fixed number
      // seasonDays = 5;
    } else {
      // de cedis 01 Qroo a merida
      if (stockItem.whsCode == "01") {
        seasonDays = 11;
      } else {
      // de Qroo a merida
        seasonDays = 4;
        if (QrooStores.includes(stockItem.whsCode)) {
          seasonDays = 9;
        }
      }
    }
  } else {
    // cedis merida 10 a tiendas merida
    seasonDays = 5;
    // tiendas merida a tiendas merida
    if (["11", "22"].includes(stockItem.whsCode)) {
      seasonDays = 5;
    }

  }


  const deliveryDays = (delivery && delivery.Days) || 0;
  let days = productDays + seasonDays + deliveryDays;

  //Product in same store/warehouse inmediatos
  if (stockItem.whsCode === delivery.ToCode && stockItem.ImmediateDelivery) {
    days = productDays;
  }
  // centro de entregas sobreescribe
  const SHOP_DELIVERY_DAYS = 2;
  if (stockItem.ShopDelivery) {
    days = productDays + SHOP_DELIVERY_DAYS;
  }
  /*
  else {
    const SHOP_DELIVERY_DAYS = 2;
    if (stockItem.ShopDelivery) {
      days = productDays + SHOP_DELIVERY_DAYS;
    } else {
      let WEEKEND_DELIVERY_DAYS = 5;
      if (stockItem.WeekendDelivery || (qrooStores.includes(stockItem.whsCode) && qrooStores.includes(delivery.ToCode))) {
        var currentDate = moment().startOf('date');
        if (currentDate.day() >= 0 && currentDate.day() <= 4) {
          WEEKEND_DELIVERY_DAYS -= 1;
        }
        days = productDays + WEEKEND_DELIVERY_DAYS;
      }
    }
  }
  */

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
    WeekendDelivery: stockItem.WeekendDelivery || false,
    PurchaseAfter: stockItem.PurchaseAfter,
    PurchaseDocument: stockItem.PurchaseDocument,
  };
}

function isMeridaWhsCode(whsCode) {
  return (
    whsCode === CEDIS_MERIDA_WHS_CODE || whsCode === STUDIO_MERIDA_WHS_CODE || whsCode === ISLA_MERIDA_WHS_CODE || whsCode === ISLA_MERIDA_ID || whsCode === STUDIO_MERIDA_ID
  );
}

function filterStockItems(stockItems, deliveries, storeWarehouseId) {
  return stockItems.filter(function (stockItem) {
    var delivery = _.find(deliveries, function (delivery) {
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
  return _.find(stockItems, function (stockItem) {
    var delivery = _.find(deliveries, function (delivery) {
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
function isDateWeekend(weekendFlag) {
  return weekendFlag;
}

function substractDeliveriesStockByQuotationDetails(
  quotationDetails,
  shippingItems,
  productId
) {
  let details = quotationDetails.slice();
  details = details.filter(function (detail) {
    return detail.Product === productId;
  });

  return shippingItems.map(function (item) {
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

  return new Promise(function (resolve, reject) {
    OrderDetailWeb.native(function (err, collection) {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      collection.aggregate([{ $match: match }, { $group: group }], function (
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

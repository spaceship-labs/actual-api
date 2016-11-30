var Promise = require('bluebird');
var _       = require('underscore');
var moment = require('moment');
var CEDIS_QROO_CODE = '01';
var CEDISQ_QROO_ID = '576acfee5280c21ef87ea5b5';

module.exports = {
  product: productShipping
};

function productShipping(product, storeWarehouse, options) {
  return Delivery.find({ToCode: storeWarehouse.WhsCode, Active:'Y'})
    .then(function(deliveries) {
      var seasonQuery = queryDate({}, new Date());
      var companies = deliveries.map(function(delivery) {
        return delivery.FromCode;
      });
      return [
        DatesDelivery.find({
          ItemCode: product.ItemCode,
          whsCode: companies,
          OpenCreQty: {
            '>': 0
          }
        }),
        deliveries,
        Season.findOne(seasonQuery)
      ];
    })
    .spread(function(stockItems, deliveries, season) {
      var codes = stockItems.map(function(p){return p.whsCode});
      return Company
        .find({WhsCode: codes})
        .then(function(codes) {
          stockItems = stockItems.map(function(stockItem) {
            //stockItem.company is storeWarehouse id
            stockItem.warehouseId = _.find(codes, function(ci) {
              return ci.WhsCode == stockItem.whsCode;
            }).id;
            return stockItem;
          });
          return [stockItems, deliveries, season];
        });
    })
    .spread(function(stockItems, deliveries, season){
      if(deliveries.length > 0 && stockItems.length > 0){
        return stockItems.map(function(stockItem){
          return buildShippingItem(
            stockItem, 
            deliveries, 
            season, 
            storeWarehouse.id
          );
        });
      }
      else if( productHasFreesale(product) && deliveries){
        var freeSaleStockItem = {
          whsCode: CEDIS_QROO_CODE,
          OpenCreQty: product.freeSaleStock,
          ItemCode: product.ItemCode,
          warehouseId: CEDISQ_QROO_ID,
          ShipDate: moment().add(product.freeSaleDeliveryDays,'days').startOf('day').toDate()
        };

        return [
          buildShippingItem(freeSaleStockItem, deliveries, season, storeWarehouse.id)
        ];
      }

      return [];
    });
}

function productHasFreesale(product){
  return product.freeSale && product.freeSaleStock && product.freeSaleDeliveryDays;
}

function buildShippingItem(stockItem, deliveries, season, storeWarehouseId){
  var delivery = _.find(deliveries, function(delivery) {
    return delivery.FromCode == stockItem.whsCode;
  });

  var productDate  = new Date(stockItem.ShipDate);
  var productDays  = daysDiff(new Date(), productDate);
  var seasonDays   = (season && season.Days) || 7;
  var deliveryDays = (delivery && delivery.Days) || 0;
  var days = productDays + seasonDays + deliveryDays;
  
  //Product in same store/warehouse
  if(stockItem.whsCode === delivery.ToCode){
    days = productDays;
  }
  
  var date = addDays(new Date(), days);

  return {
    available: stockItem.OpenCreQty,
    days: days,
    date: date,
    productDate: productDate,
    company: storeWarehouseId,
    companyFrom: stockItem.warehouseId,
    itemCode: stockItem.ItemCode
  };
}


function queryDate(query, date) {
  var date = new Date(date);
  return _.assign(query, {
    StartDate: {
      '<=': date
    },
    EndDate: {
      '>=': date
    }
  });
}

function addDays(date, days) {
  date = new Date(date);
  date.setDate(date.getDate() + days);
  return date;
}

function daysDiff(a, b) {
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  var utc1        = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2        = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}


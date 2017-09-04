var Promise = require('bluebird');
var _       = require('underscore');
var moment = require('moment');
var CEDIS_QROO_CODE = '01';
var CEDIS_QROO_ID = '576acfee5280c21ef87ea5b5';
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

var PUERTOCANCUN_WHS_ID = '599aaa1fbe1fd281203f5e8a';
var PUERTOCANCUN_WHS_ID_SANDBOX = '59972da6b7dccab7b8cf753a';
var PUERTOCANCUN_WHS_CODE = '82';
var PUERTOCANCUN_LIMIT_DATE = moment('2017-09-17').toDate();

module.exports = {
  product: productShipping,
  isDateImmediateDelivery: isDateImmediateDelivery
};

function productShipping(product, storeWarehouse, options) {

  var pendingProductDetailSum = 0;
  
  return Delivery.find({ToCode: storeWarehouse.WhsCode, Active:'Y'})
    .then(function(deliveries) {
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
        getPendingProductDetailsSum(product)
      ];
    })
    .spread(function(stockItems, deliveries, _pendingProductDetailSum) {
      pendingProductDetailSum = _pendingProductDetailSum;

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
          return [stockItems, deliveries];
        });
    })
    .spread(function(stockItems, deliveries){
      if(deliveries.length > 0 && stockItems.length > 0){

        stockItems = filterStockItems(stockItems, deliveries, storeWarehouse.id);
        var shippingPromises = stockItems.map(function(stockItem){
          return buildShippingItem(
            stockItem, 
            deliveries, 
            storeWarehouse.id,
            pendingProductDetailSum
          );
        });

        return Promise.all(shippingPromises);
      }
      else if( StockService.isFreeSaleProduct(product) && deliveries){
        product.freeSaleDeliveryDays = product.freeSaleDeliveryDays || 0;
        var shipDate = moment().add(product.freeSaleDeliveryDays,'days').startOf('day').toDate();
        var freeSaleStockItem = {
          whsCode: CEDIS_QROO_CODE,
          OpenCreQty: product.freeSaleStock,
          ItemCode: product.ItemCode,
          warehouseId: CEDIS_QROO_ID,
          ShipDate: shipDate
        };

        return Promise.all([
          buildShippingItem(
            freeSaleStockItem, 
            deliveries, 
            storeWarehouse.id,
            pendingProductDetailSum
          )
        ]);
      }

      return Promise.resolve([]);
    })
    .then(function(result){
      return result;
    });

}

function buildShippingItem(stockItem, deliveries, storeWarehouseId, pendingProductDetailSum){

  var delivery = _.find(deliveries, function(delivery) {
    return delivery.FromCode == stockItem.whsCode;
  });

  var productDate  = new Date(stockItem.ShipDate);
  var productDays  = daysDiff(new Date(), productDate);
  var seasonQuery  = getQueryDateRange({}, productDate);



  return Season.findOne(seasonQuery)
    .then(function(season){
      var LOW_SEASON_DAYS = 10; //Original: 7
      var seasonDays   = (season && season.Days) || LOW_SEASON_DAYS;
      var deliveryDays = (delivery && delivery.Days) || 0;
      var days = productDays + seasonDays + deliveryDays;
      
      //Product in same store/warehouse
      if(stockItem.whsCode === delivery.ToCode && stockItem.ImmediateDelivery){
        days = productDays;
      }
      
      var todayDate = new Date();
      var date = addDays(todayDate, days);
      var available = stockItem.OpenCreQty;
      
      if(stockItem.whsCode === CEDIS_QROO_CODE){
        available -= pendingProductDetailSum;
      }
      
      if(stockItem.whsCode === PUERTOCANCUN_WHS_CODE){
        //sails.log.info('working with PUERTOCANCUN_WHS');

        if(date < PUERTOCANCUN_LIMIT_DATE){
          //sails.log.info('PUERTOCANCUN_LIMIT_DATE', PUERTOCANCUN_LIMIT_DATE);
          date = PUERTOCANCUN_LIMIT_DATE;
          days = daysDiff(new Date(), date);
        }
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
        PurchaseAfter: stockItem.PurchaseAfter,
        PurchaseDocument: stockItem.PurchaseDocument
      };      
    });
}

function filterStockItems(stockItems, deliveries, storeWarehouseId){

  return stockItems.filter(function(stockItem){
  
    if(
      (storeWarehouseId === PUERTOCANCUN_WHS_ID || storeWarehouseId === PUERTOCANCUN_WHS_ID_SANDBOX)
      && stockItem.ImmediateDelivery
    ){
      return false;
    }


    var delivery = _.find(deliveries, function(delivery) {
      return delivery.FromCode == stockItem.whsCode;
    });

    //Only use immediate delivery stock items, when from and to warehouses
    //are the same
    if(stockItem.ImmediateDelivery){
      return stockItem.whsCode === delivery.ToCode;
    }

    return true;
  });
}


function getImmediateStockItem(stockItems, deliveries){

  return _.find(stockItems, function(stockItem){
  
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
      '<=': date
    },
    EndDate: {
      '>=': date
    },
    Active: "Y"
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

function isDateImmediateDelivery(shipDate){
  var FORMAT = 'D/M/YYYY';
  var currentDate = moment().format(FORMAT);
  shipDate = moment(shipDate).format(FORMAT);
  return currentDate === shipDate;
}

function getPendingProductDetailsSum(product){
  
  var match = {
    Product: ObjectId(product.id),
    inSapWriteProgress: true
  };

  var group = {
    _id: '$Product',
    //_id: '$quantity',
    pendingStock: {$sum:'$quantity'}
  };

  return new Promise(function(resolve, reject){
    OrderDetailWeb.native(function(err, collection){
      if(err){
        console.log('err', err);
        return reject(err);
      }
      
      collection.aggregate([
        {$match: match},
        {$group:group}
      ],
        function(_err,results){
          if(err){
            console.log('_err', _err);
            return reject(_err);
          }

          //sails.log.info('results', results);
          if(results && results.length > 0){
            return resolve(results[0].pendingStock);
          }else{
            return resolve(0);
          }
        }
      );
    });
  });  
}
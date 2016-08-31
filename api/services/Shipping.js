var Promise = require('bluebird');
var _       = require('underscore');

module.exports = {
  product: productShipping
};

function productShipping(productCode, warehouseId) {
  return Company
    .findOne(warehouseId)
    .then(function(company) {
      return Delivery.find({ToCode: company.WhsCode, Active:'Y'});
    })
    .then(function(deliveries) {
      var seasonQuery = queryDate({}, new Date());
      var companies = deliveries.map(function(delivery) {
        return delivery.FromCode;
      });
      return [
        DatesDelivery.find({
          ItemCode: productCode,
          whsCode: companies,
          OpenCreQty: {
            '>': 0
          }
        }),
        deliveries,
        Season.findOne(seasonQuery)
      ];
    })
    .spread(function(products, deliveries, season) {
      var codes = products.map(function(p){return p.whsCode});
      return Company
        .find({WhsCode: codes})
        .then(function(codes) {
          products = products.map(function(p) {
            p.company = _.find(codes, function(ci) {
              return ci.WhsCode == p.whsCode
            }).id;
            return p;
          });
          return [products, deliveries, season];
        });
    })
    .spread(function(products, deliveries, season){
      if (!deliveries || !products) {return []};
      return products.map(function(product){
        var delivery     = _.find(deliveries, function(delivery) {
          return delivery.FromCode == product.whsCode;
        });
        var productDate  = new Date(product.ShipDate);
        var productDays  = daysDiff(new Date(), productDate);
        var seasonDays   = (season && season.Days) || 7;
        var deliveryDays = (delivery && delivery.Days) || 0;
        var days         = productDays + seasonDays + deliveryDays;
        var date         = addDays(productDate, days);
        return {
          available: product.OpenCreQty,
          days: days,
          date: date,
          company: warehouseId,
          companyFrom: product.company
        };
      });
    });
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


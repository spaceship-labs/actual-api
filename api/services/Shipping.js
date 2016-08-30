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
    .spread(function(products, deliveries, season){
      if (!deliveries || !products) {return []};
      return products.map(function(product){
        var delivery     = _.find(deliveries, function(delivery) {
          return delivery.FromCode == product.whsCode;
        });
        var seasonDays   = (season && season.Days) || 7;
        var deliveryDays = (delivery && delivery.Days) || 0;
        var days         = seasonDays + deliveryDays;
        var date         = addDays(new Date(), days);
        return {
          available: product.OpenCreQty,
          days: days,
          date: date,
          company: warehouseId
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

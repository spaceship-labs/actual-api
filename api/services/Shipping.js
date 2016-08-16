var Promise = require('bluebird');
var _       = require('underscore');

module.exports = {
  product: productShipping
};

function productShipping(productCode, companyId) {
  return Promise
    .all([
      productAvailable(productCode, companyId),
      productPurchased(productCode, companyId)
    ])
    .spread(function(available, purchased) {
      var products = available
        .concat(purchased)
        .filter(function(product) {
          return product.available > 0;
        })
        .map(function(product) {
          var d = new Date(product.date);
          d.setHours(0, 0, 0, 0, 0);
          return _.assign({}, product, {
            date: d
          });
        });
      return _.sortBy(products, function(product) {
        return product.date;
      });
    });
}

function productAvailable(productCode, companyId) {
  return Company
    .findOne(companyId)
    .then(function(company) {
      return Delivery.find({FromCode: company.WhsCode});
    })
    .then(function(deliveries) {
      var seasonQuery = queryDate({}, new Date());
      var companies = deliveries
        .filter(function(delivery) {
          return delivery.Active == 'Y';
        })
        .map(function(delivery) {
          return delivery.ToCode;
        });
      return [
        ItemWarehouse.find({
          ItemCode: productCode,
          WhsCode: companies
        }),
        deliveries,
        Season.findOne(seasonQuery)
      ];
    })
    .spread(function(products, deliveries, season){
      if (!deliveries || !products) {return []};
      return products.map(function(product){
        var delivery     = _.find(deliveries, function(delivery) {
          return delivery.ToCode == product.WhsCode;
        });
        var seasonDays   = (season && season.Days) || 7;
        var deliveryDays = (delivery && delivery.Days) || 0;
        var days         = seasonDays + deliveryDays;
        var date         = addDays(new Date(), days);
        return {
          available: product.Available,
          days: days,
          date: date,
          company: companyId
        };
      });
    });
}

function productPurchased(productCode, companyId) {
  return Company
    .findOne(companyId)
    .then(function(company) {
      return Delivery.find({FromCode: company.WhsCode});
    })
    .then(function(deliveries) {
      var seasonQuery = queryDate({}, new Date());
      var companies = deliveries
        .filter(function(delivery) {
          return delivery.Active == 'Y';
        })
        .map(function(delivery) {
          return delivery.ToCode;
        });
      return [
        PurchaseOrder.find({
          ItemCode: productCode,
          WhsCode: companies
        }),
        deliveries,
        Season.findOne(seasonQuery)
      ];
    })
    .spread(function(products, deliveries, season){
      if (!deliveries || !products) {return []};
      return products.map(function(product){
        var delivery     = _.find(deliveries, function(delivery) {
          return delivery.ToCode == product.WhsCode;
        });
        var seasonDays   = (season && season.Days) || 7;
        var deliveryDays = (delivery && delivery.Days) || 0;
        var days         = seasonDays + deliveryDays;
        var date         = addDays(new Date(), days);
        return {
          available: product.OpenCreQty,
          days: days,
          date: date,
          company: companyId
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

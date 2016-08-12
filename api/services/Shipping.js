var Promise = require('bluebird');
var _       = require('underscore');

module.exports = {
  product: productShipping,
  productAvailable: productAvailable,
  productPurchased: productPurchased
};

function productShipping(productCode, companyId) {
  return Promise
    .all([
      productAvailable(productCode, companyId),
      productPurchased(productCode, companyId)
    ])
    .spread(function(product, products) {
      if (product) {
        products = products.concat(product);
      }
      return _.sortBy(products, function(product) {
        return product.date;
      });
    });
}

function productAvailable(productCode, companyId) {
  return Company
    .findOne(companyId)
    .then(function(company) {
      return ItemWarehouse.findOne({
        ItemCode: productCode,
        WhsCode: company.WhsCode
      });
    })
    .then(function(product) {
      if (!product) {return [product];}
      var seasonQuery = queryDate({}, new Date());
      return [
        product,
        Delivery.findOne({
          FromCode: product.WhsCode,
          ToCode: product.WhsCode
        }),
        Season.findOne(seasonQuery)
      ];
    })
    .spread(function(product, delivery, season) {
      if (!product) {return product;}
      var seasonDays   = (season && season.Days) || 7;
      var deliveryDays = (delivery && delivery.Days) || 0;
      var days         = seasonDays + deliveryDays;
      var date         = addDays(new Date(), days);
      return {
        available: product.OnHand,
        days: days,
        date: date
      };
    });
}

function productPurchased(productCode, companyId) {
  return Company
    .findOne(companyId)
    .then(function(company) {
      return [
        company,
        PurchaseOrder.find({
          ItemCode: productCode,
          WhsCode: company.WhsCode
        })
      ];
    })
    .spread(function(company, products) {
      var seasonQuery = {
        or: products.map(function(product) {
              return queryDate({}, product.ShipDate);
            })
      };
      return [
        products,
        Delivery.findOne({
          FromCode: company.WhsCode,
          ToCode: company.WhsCode
        }),
        Season.find(seasonQuery)
      ];
    })
    .spread(function(products, delivery, seasons) {
      return products.map(function(product) {
        var today        = new Date();
        var deliveryDays = (delivery && delivery.Days) || 0;
        var season       = seasons.filter(function(season){
          return season.StartDate >= product.ShipDate
            && season.EndDate <= product.ShipDate;
        });
        season           = season.length && season[0];
        seasonDays       = (season && season.Days) || 7;
        var days         = daysDiff(today, product.ShipDate) + seasonDays + deliveryDays;
        var date         = addDays(new Date(), days);
        return {
          available: product.Quantity - (product.IsCommited || 0) ,
          days: days,
          date: date
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

//Delivery (from store to store)
//Season (is high)

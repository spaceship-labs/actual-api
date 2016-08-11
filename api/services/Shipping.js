var _ = require('underscore');

module.exports = {
  product: productShipping,
  queryDate: queryDate
};

function productShipping(productCode, companyCode) {
  return Company
    .findOne(companyCode).then(function(company) {
      return ItemWarehouse.findOne({ItemCode: productCode, WhsCode: company.WhsCode})
    })
    .then(function(product) {
      var qdate = Shipping.queryDate({}, new Date());
      return [
        product,
        Delivery.findOne({FromCode: product.WhsCode, ToCode: product.WhsCode}),
        Season.findOne(qdate)
      ];
    })
    .spread(function(product, deliveryDays, seasonDays) {
      var seasonDays   = (seasonDays && seasonDays.Days) || 7;
      var deliveryDays = (deliveryDays && deliveryDays.Days);
      var days         = seasonDays + deliveryDays;
      var date         = addDays(days);
      return [{
        available: product.OnHand,
        days: days,
        delivery: date
      }];
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

function addDays(days, date) {
  if (!date) {
    date = new Date();
  } else {
    date = new Date(date);
  }
  date.setDate(date.getDate() + days);
  return date;
}

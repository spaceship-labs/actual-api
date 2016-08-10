var _ = require('underscore');
module.exports = {
  queryDate: queryDate,
  product: productShipping
};

function productShipping(code) {
  Product.findOne({ItemCode: code})
    .then(function(product) {
      var company = normalize(product.U_Empresa);
      return Company.findOne({WhsCode: company});
    })
    .then(function(company) {
      return Delivery.findOne({
        FromCode: company.WhsCode,
        ToCode: company.WhsCode
      });
    })
    .then(function(delivery) {
      var qdate = Shipping.queryDate({}, new Date());
      return [
        delivery,
        Season.findOne(qdate)
      ];
    })
    .spread(function(deliveryDays, seasonDays) {
      var seasonDays   = (seasonDays && seasonDays.Days) || 7;
      var deliveryDays = deliveryDays.Days;
    });
}

function normalize(code) {
  code = parseInt(code);
  return code < 9 ? '0' + code : code.toString();
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

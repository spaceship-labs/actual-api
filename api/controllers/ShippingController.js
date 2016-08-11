/**
 * ShippingController
 *
 * @description :: Server-side logic for managing shippings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  product: function(req, res) {
    var form = req.allParams();
    var productCode = form.productCode;
    var companyCode = form.companyCode;
    Shipping.product(productCode, companyCode)
      .then(function(shipping) {
        return res.json(shipping);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }
};


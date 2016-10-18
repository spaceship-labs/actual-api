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
    var storeId = form.storeId;
    Store.findOne({id:storeId}).populate('Warehouse')
      .then(function(store){
        return Shipping.product(productCode, store.Warehouse)
      })
      .then(function(shipping) {
        return res.json(shipping);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }
};


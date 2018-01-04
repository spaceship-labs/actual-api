module.exports = {

  product: function(req, res) {
    var form = req.allParams();
    /*
      @param {Object} form
      Example:
      {
        productCode: "ST10293",
        storeId: <MongoId Store>
      }
    */
    var productCode = form.productCode;
    var storeId = form.storeId;
    var store = false;
    Store.findOne({id:storeId}).populate('Warehouse')
      .then(function(storeResult){
        store = storeResult;
        return Common.nativeFindOne({ItemCode: productCode}, Product);
      })
      .then(function(product){
        return Shipping.product(product, store.Warehouse);        
      })
      .then(function(shipping) {
        return res.json(shipping);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }
};


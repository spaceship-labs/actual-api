var Promise = require('bluebird')

module.exports = {
};

//@params: detail Object from model Detail
//Must contain a Product object populated
function getDetailTotals(detail){
  var subTotal = 0;
  var total = 0;
  var product = detail.Product;
  var qty = detail.quantity;
  return Product.findOne({id:Product.id})
    .populate('Promotions')
    .then(function(p){
      var mainPromo = getMainPromo(p);
      return mainPromo;
    });
}

//@params product Object from model Product
//Populated with promotions
function getMainPromo(product){
  if(product.Promotions && product.Promotions.length > 0){
    var indexMaxPromo = 0;
    var maxPromo = 0;
    product.Promotions.forEach(function(promo, index){
      if(promo.discountPg1 >= maxPromo){
        maxPromo = promo.discountPg1;
        indexMaxPromo = index;
      }
    });
    return product.Promotions[indexMaxPromo];
  }else{
    return false;
  }
}

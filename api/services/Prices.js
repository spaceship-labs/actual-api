var Promise = require('bluebird')

module.exports = {
  processDetails: processDetails
};

//@params details: Array of objects from model Detail
//Every detail must contain a Product object populated
function processDetails(details){
  var processedDetails = details.map(function(d){
    return getDetailTotals(d);
  });
  return Promise.all(processedDetails).then(function(pDetails){
    return updateDetails(pDetails);
  });
}

function updateDetails(details){
  var updatedDetails = details.map(function(d){
    return updateDetail(d);
  });
  return Promise.all(updatedDetails);
}

function updateDetail(detail){
  return QuotationDetail.update({id: detail.id}, detail);
}

//@params: detail Object from model Detail
//Must contain a Product object populated
function getDetailTotals(detail, paymentGroup){
  paymentGroup = paymentGroup || 1;
  var subTotal = 0;
  var total = 0;
  var product = detail.Product;
  var qty = detail.quantity;
  return Product.findOne({id:product.id})
    .populate('Promotions')
    .then(function(p){
      var mainPromo = getMainPromo(p);
      var unitPrice = p.Price;
      var promo = mainPromo ? mainPromo.id : false;
      var discountKey = getDiscountKey(paymentGroup);
      var discountPercent = mainPromo ? mainPromo[discountKey] : 0;
      var subtotal = qty * unitPrice;
      var total = qty * ( unitPrice - ( ( unitPrice / 100) * discountPercent ) );
      return {
        id: detail.id,
        unitPrice: unitPrice,
        Promotion: promo, //Promotion id
        discountPercent: discountPercent,
        subtotal: subtotal,
        total:total,
        paymentGroup: paymentGroup
      }
      //return mainPromo;
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

function getDiscountKey(group){
  var keys = ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'];
  return keys[group-1];
}

var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
  processDetails: processDetails,
  getQuotationTotals: getQuotationTotals,
  updateQuotationTotals: updateQuotationTotals
};

//@params details: Array of objects from model Detail
//Every detail must contain a Product object populated
function processDetails(details, opts){
  opts = opts || {};
  var processedDetails = details.map(function(d){
    return getDetailTotals(d, opts.paymentGroup);
  });

  return Promise.all(processedDetails).then(function(pDetails){
    if(opts.updateDetails){
      return updateDetails(pDetails);
    }else{
      return pDetails;
    }
  });
}

function updateDetails(details){
  var updatedDetails = details.map(function(d){
    return updateDetail(d).then(function(updated){
      if(updated && updated.length > 0){
        return updated[0];
      }
      return null;
    });
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
      var detailTotals = {
        id: detail.id,
        unitPrice: unitPrice,
        Promotion: promo, //Promotion id
        discountPercent: discountPercent,
        subtotal: subtotal,
        total:total,
        paymentGroup: paymentGroup,
        quantity: qty,
      }
      return detailTotals;
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

function updateQuotationTotals(quotationId, opts){
  opts = opts || {paymentGroup:1 , updateDetails: true};
  return getQuotationTotals(quotationId, opts).then(function(totals){
    if(opts && opts.updateParams){
      totals = _.extend(totals, opts.updateParams);
    }
    return Quotation.update({id:quotationId}, totals);
  });
}

function getQuotationTotals(quotationId, opts){
  opts = opts || {paymentGroup:1 , updateDetails: true};
  return Quotation.findOne({id:quotationId}).populate('Details')
    .then(function(quotation){
      var detailsIds = [];
      if(quotation.Details){
        detailsIds = quotation.Details.map(function(d){return d.id});
        return QuotationDetail.find({id:detailsIds}).populate('Product');
      }else{
        return [];
      }
    })
    .then(function(details){
      return processDetails(details,opts)
    })
    .then(function(processedDetails){
      var totals = {
        subtotal:0,
        total:0,
        discount:0,
        totalProducts: 0
      };
      processedDetails.forEach(function(pd){
        totals.total+= pd.total;
        totals.subtotal += pd.subtotal;
        totals.discount += (pd.subtotal - pd.total);
        totals.totalProducts += pd.quantity;
      });
      return totals;
    });

}

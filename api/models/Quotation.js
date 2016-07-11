//APP COLLECTION
module.exports = {
  migrate: 'alter',
  tableName: 'Quotation',
  attributes: {
    Client:{
      model:'Client'
    },
    User:{
      model: 'User',
    },
    Details: {
      collection:'QuotationDetail',
      via:'Quotation'
    },
    Records: {
      collection:'QuotationRecord',
      via:'Quotation'
    },
    Address:{
      model:'QuotationAddress',
    },
    Order:{
      model:'Order'
    },
    Payments:{
      collection: 'Payment',
      via:'Quotation'
    },

    clientName: {type:'string'},
    folio:{type:'integer'},
    total:{type:'float'},
    ammountPaid: {type:'float'}
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'quotationFolio',function(val){
      cb();
    });
  },

};

function calculateTotal(details){
  var total = 0;
  details.forEach(function(detail){
    if(detail.Product && detail.Product.Price){
      total+= detail.Product.Price * detail.Quantity;
    }
  });
  return total;
}

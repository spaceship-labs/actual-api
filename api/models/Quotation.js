//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema:true,
  tableName: 'Quotation',
  attributes: {
    Client:{
      model:'Client'
    },
    User:{
      model: 'User',
    },
    Broker:{
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
      model:'ClientContact',
    },
    Order:{
      model:'Order'
    },
    Payments:{
      collection: 'Payment',
      via:'Quotation'
    },
    Store:{
      model:'company'
    },
    isClosed:{type:'boolean'},
    isClosedReason:{type:'string'},
    isClosedNotes:{type:'text'},
    clientName: {type:'string'},
    folio:{type:'integer'},
    total:{type:'float'},
    subtotal: {type:'float'},
    discount: {type:'float'},
    ammountPaid: {type:'float'},
    totalProducts: {type:'integer'},
    //TODO: Check status types
    status:{
      type:'string',
      enum:['closed','pending-payment','to-order']
    }
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'quotationFolio',function(val){
      cb();
    });
  },

};

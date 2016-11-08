var moment = require('moment');

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
    EwalletRecords:{
      collection:'EwalletRecord',
      via:'Quotation'
    },
    Store:{
      model:'store'
      //model:'company'
    },
    Manager:{
      model:'user'
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
    paymentGroup:{type:'integer'},
    minPaidPercentage: {
      type:'float',
      defaultsTo: 60
      //defaultsTo: 100
    },
    //TODO: Check status types
    status:{
      type:'string',
      //enum:['closed','pending-payment','to-order']
    },
    source:{
      type:'string',
    },
    tracing: {
      type:'datetime',
      defaultsTo: moment().add(5,'days').format("YYYY-MM-DD HH:mm:ss")
    }
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'quotationFolio',function(val){
      cb();
    });
  },

};

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

    clientName: {type:'string'},
    folio:{type:'integer'}
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'quotationFolio',function(val){
      cb();
    });
  }

};

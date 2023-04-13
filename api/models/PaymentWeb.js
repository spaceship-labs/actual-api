//APP COLLECTION
//Only read, using only for cash report
module.exports = {
  schema:true,
  migrate:'alter',
  attributes:{
    type: {
      type:'string',
      isIn:[
        'debit-card',
        'credit-card',
        //'transfer',
        '3-msi',
        '6-msi',
        '9-msi',
        '12-msi',
        '18-msi',
      ]
    },
    folio:{type:'string'},
    name:{type:'string'},
    ammount:{type:'number', columnType: 'float'},
    currency:{
      type:'string',
      isIn:[
        'mxn',
        'usd'
      ]
    },
    exchangeRate:{type:'number', columnType: 'float'},
    verificationCode: {type:'string'},
    conektaId: {type:'string'},
    isCancelled: {type:'boolean'},
    isCancellation: {type:'boolean'},
    isRecurring: {type:'boolean'},
    msi:{type:'number', columnType: 'float'},
    paymentType: {type:'string'},
    terminal: {
      type:'string',
      isIn:[
        'american-express',
        'banamex',
        'bancomer',
        'banorte',
        'santander'
      ]
    },
    card: {type:'string'},
    cardLastDigits: {type:'string'},
    cardName: {type:'string'},
    cardToken: {type:'string'},
    group:{type:'number'},
    description:{type:'string'},
    status:{
      type:'string',
      isIn: ['paid','pending','canceled']
    },
    sentToSap: {
      type:'boolean'
    },
    Store:{
      model:'store'
      //model:'company'
    },
    Client:{
      model: 'Client'
    },
    OrderWeb:{
      model:'OrderWeb'
    }
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'paymentWebFolio',function(val){
      cb();
    });
  },

};

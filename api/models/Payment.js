//APP COLLECTION
module.exports = {
  schema:true,
  migrate:'alter',
  attributes:{
    type: {
      type:'string',
      enum:[
        'cash',
        'cash-usd',
        'cheque',
        'deposit',
        'transfer',
        'ewallet',
        'credit-card', //TODO remove
        'single-payment-terminal',
        '3-msi',
        '6-msi',
        '9-msi',
        '12-msi',
        '18-msi'
      ]
    },
    folio:{type:'integer'},
    name:{type:'string'},
    ammount:{type:'float'},
    currency:{
      type:'string',
      enum:[
        'mxn',
        'usd'
      ]
    },
    exchangeRate:{type:'float'},
    verificationCode: {type:'string'},
    terminal:{type:'string'},
    isRecurring: {type:'boolean'},
    msi:{type:'float'},
    paymentType: {type:'string'},
    terminal: {
      type:'string',
      enum:[
        'american-express',
        'banamex',
        'bancomer',
        'banorte',
        'santander'        
      ]
    },
    card: {type:'string'},
    cardLastDigits: {type:'string'},
    cardExpDate: {type:'string'},
    group:{type:'integer'},
    description:{type:'string'},
    status:{
      type:'string',
      enum: ['paid','pending','cancelled']
    },
    Store:{
      model:'store'
      //model:'company'
    },
    Order:{
      model:'Order'
    },
    Quotation:{
      model:'Quotation'
    },
    User:{
      model:'User'
    },
    Commissions: {
      collection: 'commission',
      via: 'payment'
    },
    Client:{
      model: 'Client'
    }
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'paymentFolio',function(val){
      cb();
    });
  },

  afterCreate: function(val, cb) {
    Payment
      .findOne(val.id)
      .populate('User')
      .populate('Store')
      .then(function(payment) {
        var store  = payment.Store.id;
        var ustore = payment.User.mainStore;
        if (store == ustore) {
          return [Commissions.calculate(store)];
        } else {
          return [
            Commissions.calculate(store),
            Commissions.calculate(ustore),
          ];
        }
      })
      .all()
      .then(function() {
        cb();
      })
      .catch(function(err) {
        cb(err);
      });
  }
}

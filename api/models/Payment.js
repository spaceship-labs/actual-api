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
        'monedero',
        'credit-card',
        '3-msi',
        '6-msi',
        '9-msi',
        '12-msi',
        '18-msi'
      ]
    },
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
    terminal: {type:'string'},
    group:{type:'integer'},
    description:{type:'string'},
    status:{
      type:'string',
      enum: ['paid','pending','cancelled']
    },
    Store:{
      model:'company'
    },
    Order:{
      model:'Order'
    },
    Quotation:{
      model:'Quotation'
    },
    User:{
      model:'User'
    }
  }
}

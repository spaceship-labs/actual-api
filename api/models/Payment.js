//APP COLLECTION
module.exports = {
  schema:true,
  migrate:'alter',
  attributes:{
    type: {
      type:'string'
    },
    ammount:{type:'float'},
    currency:{type:'string'},
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
    Order:{
      model:'Order'
    },
    Quotation:{
      model:'Quotation'
    }
  }
}

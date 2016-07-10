//APP COLLECTION
module.exports = {
  migrate:'alter',
  attributes:{
    type: {
      type:'string'
    },
    ammount:{type:'float'},
    currency:{type:'string'},
    verificationCode: {type:'string'},
    terminal:{type:'string'},
    status:{
      type:'string',
      enum: ['paid','pending','cancelled']
    },
    Order:{
      model:'Order'
    }
  }
}

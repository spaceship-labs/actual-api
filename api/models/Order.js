//APP COLLECTION
module.exports = {
  migrate:'alter',
  attributes:{
    DocEntry:{type:'integer'},
    SlpCode: {type:'string'},
    CardCode: {type:'string'},
    total:{type:'float'},
    subtotal:{type:'float'},
    discount:{type:'float'},
    currency:{type:'string'},
    status:{type:'string'},
    name:{type:'string'},
    lastName:{type:'string'},
    dialCode: {type:'string'},
    phone:{type:'string'},
    email:{type:'string'},
    mobileDialCode:{type:'string'},
    mobilePhone: {type:'string'},
    street:{type:'string'},
    externalNumber:{type:'string'},
    internalNumber:{type:'string'},
    neighborhood: {type:'string'},
    municipality: {type:'string'},
    city:{type:'string'},
    entity:{type:'string'},
    zipCode: {type:'string'},
    street: {type:'string'},
    street2: {type:'string'},
    references:{type:'text'},
    Quotation:{
      model:'Quotation'
    },
    Sale: {
      model:'Sale'
    },
    Client:{
      model:'Client'
    },
    Details: {
      collection:'OrderDetail',
      via:'Order'
    },
    Payments: {
      collection:'Payment',
      via:'Order'
    },


  }
}

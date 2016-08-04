//APP COLLECTION
module.exports = {
  migrate:'alter',
  schema: true,
  attributes:{
    DocEntry:{type:'integer'},
    folio:{type:'integer'},
    SlpCode: {type:'integer'},
    CardCode: {type:'string'},
    ammountPaid: {type:'float'},
    total:{type:'float'},
    subtotal:{type:'float'},
    discount:{type:'float'},
    currency:{type:'string'},
    paymentGroup:{type:'integer'},
    status:{
      type:'string',
      //enum:['lost','pending','on-delivery','minimum-paid','paid']
    },
    Quotation:{
      model:'Quotation',
      unique:true
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
    User:{
      model: 'User',
    },
    Broker:{
      model: 'User',
    },
    Address:{
      model:'ClientContact',
    },
    Store:{
      model:'company',
      required: 'true'
    },


    //CONTACT ADDRESS FIELDS SNAPSHOT
    //APP/SAP FIELDS
    email:{
      type:'string'
    },
    firstName:{
      type:'string'
    },
    middleName:{
      type:'string'
    },
    lastName:{
      type:'string'
    },

    //SAP FIELDS
    CntCtCode:{type:'integer'},
    name:{
      type:'string'
    },
    address: {
      type:'string'
    },
    phone1:{
      type:'string'
    },
    phone2:{
      type:'string'
    },
    mobileSAP:{
      type:'string'
    },

    //APP FIELDS
    dialCode: {type:'string'},
    phone:{type:'string'},
    email:{type:'string'},
    mobileDialCode:{type:'string'},
    mobilePhone: {type:'string'},
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
  },

  beforeCreate: function(val,cb){
    Common.orderCustomAI(val, 'orderFolio',function(val){
      cb();
    });
  },
}

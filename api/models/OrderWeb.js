//APP COLLECTION
module.exports = {
  migrate:'safe',
  schema: true,
  attributes:{
    DocEntry:{type:'number'},
    folio:{type:'string'},
    documents:{
      type:'json', columnType:'array'
    },
    immediateDelivery:{type:'number', columnType: 'float'},
    ShopDelivery:{type:'number', columnType: 'float'},
    WeekendDelivery:{type:'number', columnType: 'float'},
    ammountPaid: {type:'number', columnType: 'float'},
    ammountPaidPg1:{type:'number', columnType: 'float'},
    total:{type:'number', columnType: 'float'},
    totalPg1: {type:'number', columnType: 'float'},
    totalPg2: {type:'number', columnType: 'float'},
    totalPg3: {type:'number', columnType: 'float'},
    totalPg4: {type:'number', columnType: 'float'},
    totalPg5: {type:'number', columnType: 'float'},

    discountPg1: {type:'number', columnType: 'float'},
    discountPg2: {type:'number', columnType: 'float'},
    discountPg3: {type:'number', columnType: 'float'},
    discountPg4: {type:'number', columnType: 'float'},
    discountPg5: {type:'number', columnType: 'float'},

    isSpeiOrder: {type:'boolean'},
    speiExpirationPayment: {type:'string',columnType:'datetime'},
    speiExpirationReminderStartDate: {type:'string',columnType:'datetime'},
    paymentReminderSent:{type:'boolean'},
    paymentExpirationSent:{type:'boolean'},

    subtotal:{type:'number', columnType: 'float'},
    discount:{type:'number', columnType: 'float'},
    currency:{type:'string'},
    paymentGroup:{type:'number'},
    WhsCode:{type:'string'},
    status:{
      type:'string',
      isIn:[
        'lost',
        'pending',
        'on-delivery',
        'minimum-paid',
        'paid',
        'pending-sap',
        'pending-payment',
        'completed',
        'canceled'
      ]
    },
    inSapWriteProgress:{type:'boolean'},
    Payments: {
      collection:'PaymentWeb',
      via:'OrderWeb'
    },


    conektaId:{type:'string'},
    receiving_account_bank:{type:'string'},
    receiving_account_number:{type:'string'},
    conektaAmount: {type:'number', columnType: 'float'},
    //CONTACT ADDRESS FIELDS SNAPSHOT
    //APP/SAP FIELDS


    //SAP FIELDS
    CntCtCode:{type:'number'},
    SlpCode: {type:'number'},
    CardCode: {type:'string'},
    CardName: {type:'string'},

    //ADDRESS FIELDS SNAPSHOT
    E_Mail:{type:'string'},
    FirstName:{type:'string'},
    LastName:{type:'string'},

    CntctCode:{type:'number'},
    Tel1:{type:'string'},
    Cellolar:{type:'string'},
    address:{type:'string'},
    U_Noexterior: {type:'string'},
    U_Nointerior: {type:'string'},
    U_Colonia: {type:'string'},
    U_Mpio: {type:'string'},
    U_Ciudad: {type:'string'},
    U_Estado: {type:'string'},
    U_CP: {type:'string'},
    U_Entrecalle: {type:'string'},
    U_Ycalle: {type:'string'},
    U_Notes1: {type:'string'},
    U_Latitud: {type:'string'},
    U_Longitud: {type:'string'},

    //APP FIELDS

    minPaidPercentage: {
      type:'number', columnType: 'float',
      defaultsTo: 60
      //defaultsTo: 100
    }
  }
};

// APP/SAP COLLECTION
module.exports = {
  schema: true,
  migrate:'alter',
  tableName:'Contact',
  attributes:{

    /*-----/
    FIELDS SAP
    /*-----*/
    CardCode:{type:'string'},
    CardName:{type:'string'},
    Phone1:{type:'string'},
    Phone2:{type:'string'},
    Cellular:{type:'string'},
    E_Mail:{type:'string'},
    Currency:{type:'string'},
    validFor : {type:'string'},
    LicTradNum : {type:'string'},
    Free_Text : {type:'text'},
    SlpCode : {type:'integer'},
    /*Seller:{
      model:'User',
      columnName: 'SlpCode'
    }
    */

    /*-----/
    FIELDS APP
    /*-----*/

    Quotations: {
      collection:'Quotation',
      via: 'Client',
    },

    Orders: {
      collection:'Order',
      via: 'Client',
    },

    firstName:{type:'string'},
    lastName:{type:'string'},
    title:{type:'string'},
    gender:{type:'string'},
    birthDate:{type:'date'},

    dialCode: {type:'string'},
    phone:{type:'string'},
    email: {
      type:'string',
      unique: true
    },
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

    bussinessLegalName: {type:'string'},
    bussinessName: {type:'string'},
    rfc:{type:'string'},

    invoiceEmail: {type:'string'},
    invoiceDialCode: {type:'string'},
    invoicePhone: {type:'string'},
    invoiceStreet: {type:'string'},
    invoiceExternalNumber:{type:'string'},
    invoiceInternalNumber:{type:'string'},
    invoiceNeighborhood: {type:'string'},
    invoiceMunicipality: {type:'string'},
    invoiceCity:{type:'string'},
    invoiceEntity:{type:'string'},
    invoiceZipCode: {type:'string'},

    deliveryName: {type:'string'},
    deliveryLastName: {type:'string'},
    deliveryDialCode: {type:'string'},
    deliveryPhone:{type:'string'},
    deliveryEmail:{type:'string'},
    deliveryMobileDialCode:{type:'string'},
    deliveryMobilePhone: {type:'string'},
    deliveryExternalNumber:{type:'string'},
    deliveryInternalNumber:{type:'string'},
    deliveryNeighborhood: {type:'string'},
    deliveryMunicipality: {type:'string'},
    deliveryCity:{type:'string'},
    deliveryEntity:{type:'string'},
    deliveryZipCode: {type:'string'},
    deliveryStreet: {type:'string'},
    deliveryStreet2: {type:'string'},
    deliveryReferences:{type:'text'},


  }
}

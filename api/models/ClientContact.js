//APP / SAP COLLECTION
module.exports = {
  schema: true,
  tableName: 'PersonContact',
  attributes: {
    //APP/SAP FIELDS
    E_Mail:{
      //columnName: 'E_Mail',
      type:'string'
    },
    /*
    email:{
      columnName:'E_MailL',
      type:'string'
    },
    */
    FirstName:{
      type:'string'
    },
    MiddleName:{
      type:'string'
    },
    LastName:{
      type:'string'
    },

    //SAP FIELDS
    CntctCode:{type:'integer'},
    CardCode:{type:'string'},
    Name:{
      type:'string'
    },
    Address: {
      type:'string'
    },
    Tel1:{
      type:'string'
    },
    Tel2:{
      type:'string'
    },
    Cellolar:{
      type:'string'
    },

    active:{
      columnName: 'Active',
      type:'string',
    },

    //APP FIELDS
    dialCode: {type:'string'},
    phone:{type:'string'},
    //email:{type:'string'},
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
    street3: {type:'string'},
    references:{type:'text'},
    birthDate:{
      type:'date'
    },
    coordsLat:{type:'string'},
    coordsLng:{type:'string'}

  }
};

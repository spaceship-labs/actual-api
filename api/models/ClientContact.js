//APP / SAP COLLECTION
module.exports = {
  schema: true,
  tableName: 'PersonContact',
  attributes: {
    //APP/SAP FIELDS
    E_Mail:{
      type:'string'
    },
    /*
    email:{
      columnName:'E_MailL',
      type:'string'
    },
    */
    firstName:{
      columnName:'FirstName',
      type:'string'
    },
    middleName:{
      columnName: 'MiddleName',
      type:'string'
    },
    lastName:{
      columnName: 'LastName',
      type:'string'
    },

    //SAP FIELDS
    CntCtCode:{type:'integer'},
    CardCode:{type:'string'},
    name:{
      columnName:'Name',
      type:'string'
    },
    address: {
      columnName:'Address',
      type:'string'
    },
    phone1:{
      columnName:'Tel1',
      type:'string'
    },
    phone2:{
      columnName:'Tel2',
      type:'string'
    },
    mobileSAP:{
      columnName:'Cellolar',
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
    references:{type:'text'},
    birthDate:{
      type:'date'
    },
    coordsLat:{type:'string'},
    coordsLng:{type:'string'}

  }
};

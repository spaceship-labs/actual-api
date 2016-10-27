//APP / SAP Collection
module.exports = {
  schema: true,
  migrate:'alter',
  tableName: 'AddressContact',
  attributes:{
    //SAP FIELDS
    companyName:{
      columnName: 'Address',
      type:'string'
    },
    CardCode:{type:'string'},
    Phone1: {type:'string'},
    E_Mail:{type:'string'},
    Street:{type:'string'},
    U_NumExt:{type:'string'},
    U_NumInt:{type:'string'},
    Block: {type:'string'},
    U_Localidad:{type:'string'},
    City:{type:'string'},
    State:{type:'string'},
    ZipCode:{type:'string'},
    AddressType:{type:'string'},

    //APP FIELDS
    rfc:{type:'string'},
  }
};

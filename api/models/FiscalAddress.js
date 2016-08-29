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
    Street:{type:'string'},
    Block: {type:'string'},
    ZipCode:{type:'string'},
    City:{type:'string'},
    County:{type:'string'},
    State:{type:'string'},
    LineNum:{type:'integer'},
    AddressType:{type:'string'},
    StreetNo:{type:'string'},
    U_NumExt:{type:'string'},
    U_NumInt:{type:'string'},
    U_Localidad:{type:'string'},

    //APP FIELDS
    municipality:{type:'string'},
    rfc:{type:'string'},
    phone:{type:'string'},
    dialCode:{type:'string'},
    email:{type:'string'}
  }
}

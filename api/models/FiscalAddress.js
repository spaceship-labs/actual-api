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
    U_Correos:{type:'string'},
    Street:{type:'string'},
    U_NumExt:{type:'string'},
    U_NumInt:{type:'string'},
    Block: {type:'string'},
    U_Localidad:{type:'string'},
    City:{type:'string'},
    State:{type:'string'},
    ZipCode:{type:'string'},
    AdresType:{type:'string'},

    //RELATIONS (AUXILIAR)
    //Important: This is an auxiliar Relation, all FiscalAddress in client, must be searched by a 
    //an or query: {$or: [
    //  {Client: clientId},
    //  {CardCode: clientCardCode}
    //  ]}
    Client:{
        model:'Client'
    }


  }
};

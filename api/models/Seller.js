//SAP COLLECTION
module.exports = {
  schema: true,
  tableName:'Seller',
  attributes:{
    /*
    id : {
      type:'number',
      primaryKey: true,
      columnName: 'SlpCode'
    }*/
    SlpCode:{
      type:'number'
    },
    SlpName: {
      type:'string'
    },
    Users: {
      collection: 'User',
      via: 'Seller'
    }
  }
}

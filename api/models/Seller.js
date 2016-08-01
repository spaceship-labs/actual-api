//SAP COLLECTION
module.exports = {
  tableName:'Seller',
  attributes:{
    id : {
      type:'integer',
      primaryKey: true,
      columnName: 'SlpCode'
    },
    SlpName: {
      type:'string'
    },
    User: {
      model:'User',
      unique: true
    }
  }
}

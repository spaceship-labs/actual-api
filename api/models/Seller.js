module.exports = {
  migrate:'alter',
  tableName:'Seller',
  attributes:{
    SlpName: {type:'string'},
    id : {
      type:'integer',
      primaryKey: true,
      columnName: 'SlpCode'
    },
    User: {
      model:'User'
    }
  }
}

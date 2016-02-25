module.exports = {
  connection: 'mysql',
  migrate: 'alter',
  tableName: 'Product_File',
  attributes: {
    filename:{type:'string'},
    name:{type:'string'},
    type:{type:'string'},
    typebase:{type:'string'},
    size:{type:'integer'},
    Product:{
      model:'product',
      columnName:'ItemCode',
      type:'string',
      size:20,
      //excludeSync: true
    }
  }
}

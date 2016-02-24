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
    product:{
      model:'Product'
    }
  }
}

module.exports = {
  //connection: 'mysql',
  //migrate: 'safe',
  //tableName: 'Product_File',
  migrate: 'alter',
  attributes: {
    filename:{type:'string'},
    name:{type:'string'},
    type:{type:'string'},
    typebase:{type:'string'},
    size:{type:'integer'},
    QuotationRecord:{
      model:'QuotationRecord',
    }
  }
}

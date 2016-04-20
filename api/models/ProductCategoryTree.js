module.exports = {
  //migrate:'alter',
  connection:'mysql',
  attributes:{
    Parent:{type:'integer', model: 'productcategory'},
    Child:{type:'integer', model: 'productcategory'},
    MainParent:{type:'integer'}
  }
}

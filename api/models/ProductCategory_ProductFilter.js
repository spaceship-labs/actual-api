module.exports = {
  migrate:'alter',
  connection:'mysql',
  attributes:{
    productcategory:{model:'ProductCategory'},
    productfilter:{model:'ProductFilter'}
  }
}

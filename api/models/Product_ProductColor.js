module.exports = {
  migrate:'alter',
  connection:'mysql',
  attributes:{
    product:{model:'Product'},
    color:{model:'ProductColor'}
  }
}

module.exports = {
  connection: 'mysql',
  migrate: 'alter',
  tableName: 'ProductCategorySAP',
  tableNameSqlServer: '@PRODUCTO',
  attributes: {
    Code:{type:'string', size:30},
    Name:{type:'string', size: 30},
  },

}

module.exports = {
	connection: 'mysql',
	migrate: 'alter',
	tableName: 'ProductCategory',
	tableNameSqlServer: '@PRODUCTO',
	attributes: {
		Code:{type:'string', size:30},
		Name:{type:'string', size: 30},
	},

}
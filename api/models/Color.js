module.exports = {
	connection: 'mysql',
	migrate: 'alter',
	tableName: 'Color',
	tableNameSqlServer: '@COLOR',
	attributes: {
		Code:{type:'string', size:30},
		Name:{type:'string', size: 30},
	},

}
module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'Color',
	tableNameSqlServer: '@COLOR',
	attributes: {
		Code:{type:'string', size:30},
		Name:{type:'string', size: 30},
	},

}

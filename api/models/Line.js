module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'Line',
	tableNameSqlServer: '@LINEA',
	attributes: {
		Code:{type:'string', size:30},
		Name:{type:'string', size: 30},
	},

}

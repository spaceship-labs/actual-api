module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'PriceList',
	tableNameSqlServer: 'OPLN',
	attributes: {
		ListNum:{type:'integer', size:30},
		ListName:{type:'string', size: 32},
	},

}

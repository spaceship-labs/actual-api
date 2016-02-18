module.exports = {
	connection: 'mysql',
	migrate: 'alter',
	tableName: 'PriceList',
	tableNameSqlServer: 'OPLN',
	attributes: {
		ListNum:{type:'integer', size:30},
		ListName:{type:'string', size: 32},
	},

}
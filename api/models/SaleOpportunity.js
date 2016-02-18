module.exports = {
	connection: 'mysql',
	migrate: 'alter',
	tableName: 'SaleOpportunity',
	tableNameSqlServer: 'OOPR',
	attributes: {
		OpprId:{type:'integer'},
		CardCode:{type:'string', size: 15},
		OpenDate:{type:'datetime'},
		Memo:{type:'text'},
		Status:{type:'string',size:1},
		CardName:{type:'string',size:100}
	},

}
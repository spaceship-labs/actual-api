module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'ItemWarehouse',
	tableNameSqlServer: 'OITW',
	attributes: {
		ItemCode:{type:'string', size:20, model:'product'},
		WhsCode:{type:'string', size:20},
		OnHand:{type:'float'},
		IsCommited:{type:'float'},
		OnOrder:{type:'float'}
	},

}

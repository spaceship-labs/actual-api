module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'ItemPrice',
	tableNameSqlServer: 'ITM1',
	attributes: {
		//ItemCode:{type:'string',size:20},
    //Product:{model: 'product', columnName: 'ItemCode', via:'ItemCode'},
    //ItemCode:{primaryKey: true},
    ItemCode: {type:'string',size:20},
    Product:{
      model:'product',
      columnName:'ItemCode',
      type:'string',
      size:20,
      excludeSync: true
    },
    PriceList:{type:'integer', size: 4},
		Price:{type:'float'},
		Currency:{type:'string',size:3}
	},

}

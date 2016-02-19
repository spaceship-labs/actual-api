module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'Product',
	tableNameSqlServer: 'OITM',
	attributes: {
		ItemCode:{type:'string'},
		ItemName:{type:'string'},
		CodeBars:{type:'string'},
		OnHand:{type:'string'},
		IsCommited:{type:'float'},
		BuyUnitMsr:{type:'string'},
		SalUnitMsr:{type:'string'},
		PicturName:{type:'string'},
		PurPackMsr:{type:'string'},
		PurPackUn:{type:'float'},
		SalPackMsr:{type:'string'},
		U_LINEA:{type:'string',size:60},
		U_PRODUCTO:{type:'string',size:60},
		U_COLOR:{type:'string',size:60},
		U_garantia:{type:'string',size:60},

	},

}

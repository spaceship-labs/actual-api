module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'Product',
	tableNameSqlServer: 'OITM',
	attributes: {
		ItemCode:{
      type:'string',
      primaryKey:true
    },
    /*
		//id: {
      columnName: 'ItemCode',
      type: 'string',
      primaryKey: true
    },*/
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
    prices: {
      collection: 'itemprice',
      via:'Product',
      //excludeSync: true
      //columnName: 'ItemCode'
    },
    files: {
      collection: 'productfile',
      via:'Product',
      //excludeSync: true
    },
    stock:{
      collection: 'itemwarehouse',
      via: 'ItemCode'
    },

    icon_filename:{type:'string'},
    icon_name:{type:'string'},
    icon_type:{type:'string'},
    icon_typebase:{type:'string'},
    icon_size:{type:'integer'},
	},

}

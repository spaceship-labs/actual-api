module.exports.joins = {

	product :{
		tableName: 'Product',
		key:'ItemCode',
		where: 'ITM1.PriceList = 1',
		orderby: 'ItemCode',
		left: {
			tableNameSqlServer: 'OITM',
			attributes: {
		  		ItemCode:{
		      		type:'string',
		      		primaryKey:true
		    	},
		        ItemName:{type:'string'},
		        CodeBars:{type:'string'},
		        OnHand:{type:'string'},
		        IsCommited:{type:'float'},
		        OnOrder:{type:'string'},
		        SalUnitMsr:{type:'string'},
		        U_LINEA:{type:'string',size:60},
		        U_PRODUCTO:{type:'string',size:60},
		        U_COLOR:{type:'string',size:60},
		        U_garantia:{type:'string',size:60},
		        U_disenado_en:{type:'string',size:60},
		        U_ensamblado_en:{type:'string',size:60},
			},
		},

		right:{
			tableNameSqlServer: 'ITM1',
			attributes:{
				PriceList:{type:'integer', size: 4},
				Price:{type:'float'},
				Currency:{type:'string',size:3}				
			}
		}
	}


};
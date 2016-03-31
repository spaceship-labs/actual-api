module.exports = {
	connection: 'mysql',
	migrate: 'safe',
	tableName: 'Warehouse',
	tableNameSqlServer: 'OWHS',
	attributes: {
		WhsCode:{type:'string', size:8},
		WhsName:{type:'string', size: 100},
		IntrnalKey:{type:'integer'},
		U_Calle:{type:'string',size:150},
		U_noExterior:{type:'string', size:15},
		U_noInterior:{type:'string',size:15},
		U_Colonia:{type:'string',size:150},
		U_Localidad:{type:'string',size:150},
		U_Municipio:{type:'string',size:150},
		U_Estado:{type:'string',size:50},
		U_Pais:{type:'string',size:50},
		U_CodigoPostal:{type:'string',size:10},
		U_Serie_FCP:{type:'string',size:25},
		U_Serie_ND:{type:'string',size:25},
		U_Serie_NC:{type:'string',size:25},
		U_Serie_FR:{type:'string',size:25},
		U_Serie_FA:{type:'string',size:25},
		U_EsTransito:{type:'integer'},
		U_Bodega:{type:'integer'},
		U_InfoWhs:{type:'integer'},
		U_Procesado:{type:'integer'}
	}
}

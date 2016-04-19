module.exports = {
	migrate:'alter',
	connection:'mysql',
	tableName:'ProductBrand',
	tableNameSqlServer: 'OITB',
	attributes:{
		ItmsGrpCod:{type:'integer', primaryKey:true},
		ItmsGrpNam:{type:'string'},

		Products:{
			collection:'product',
			via:'ItmsGrpCod'
		}
	}
}

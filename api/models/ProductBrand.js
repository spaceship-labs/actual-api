//SAP COLLECTION
module.exports = {
	//migrate:'alter',
  schema: true,
	tableName:'ProductBrand',
	attributes:{
		ItmsGrpCod:{type:'number'},
		ItmsGrpNam:{type:'string'},

		Products:{
			collection:'product',
			via:'ItmsGrpCod'
		}
	}
}

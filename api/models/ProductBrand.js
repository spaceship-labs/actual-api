//SAP COLLECTION
module.exports = {
	//migrate:'alter',
	tableName:'ProductBrand',
	attributes:{
		ItmsGrpCod:{type:'integer'},
		ItmsGrpNam:{type:'string'},

		Products:{
			collection:'product',
			via:'ItmsGrpCod'
		}
	}
}

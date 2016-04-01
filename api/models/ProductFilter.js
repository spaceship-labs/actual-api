module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Parent:{type:'integer'},
		Description:{type:'text'},
		Keywords:{type:'string'},
		Handle:{type:'string'},
		IsMain:{type:'boolean'},
		IsSub:{type:'boolean'},
		Lighting:{type:'boolean'},
		Target: {type:'boolean'},
		Beds: {type:'boolean'},
		Towells:{type:'boolean'},
		Shape:{type:'boolean'},
		Functionality:{type:'boolean'},
		Firmness: {type:'boolean'},
    Spacific: {type:'boolean'},

		Products:{
			collection:'product',
			through:'product_productfilter'
		},

    Categories:{
      collection:'productcategory',
      through: 'productcategory_productfilter'
    }
	}
}

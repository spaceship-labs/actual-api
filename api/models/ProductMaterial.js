module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Parent:{type:'integer'},
		Description:{type:'text'},
		Keywords:{type:'string'},
		Handle:{type:'string'},
		IsMain:{type:'boolean'},
		Parent:{type:'integer'},

		Products:{
			collection:'product',
			through: 'product_productmaterial'
		}	

	}
}
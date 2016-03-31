module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		HexCode:{type:'text'},
		Handle:{type:'string'},		

		Products:{
			collection:'product',
			through:'product_productcolor'
		}		
	}
}
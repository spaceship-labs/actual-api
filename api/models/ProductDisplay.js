module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Description:{type:'text'},
		Handle:{type:'string'},

		Products:{
			collection:'product',
			through:'product_productdisplay'
		}
	}
}
module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Parent:{type:'integer'},
		Description:{type:'text'},
		Keywords:{type:'string'},
		Handle:{type:'string'},

		Products:{
			collection:'product',
			viar:'brand'
		}	
	}
}
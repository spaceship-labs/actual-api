module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Handle:{type:'string'},
		Months:{type:'float',required:true},
		Description:{type:'text'},

		Products:{
			collection:'product',
			via:'Guarantee'
		}		
	}
}
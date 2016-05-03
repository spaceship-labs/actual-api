module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
        Length:{type:'string'},
        Width:{type:'string'},
        Height:{type:'string'},
        Volume:{type:'string'},
        Weight:{type:'string'},

		Products:{
			collection:'product',
			via:'Sizes'
		}
	}
}

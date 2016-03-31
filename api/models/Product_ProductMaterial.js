module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		product:{model:'Product'},
		usezone:{model:'ProductMaterial'}
	}
}
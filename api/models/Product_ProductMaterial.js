module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		product:{model:'Product'},
		material:{model:'ProductMaterial'}
	}
}

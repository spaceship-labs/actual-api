module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		product:{model:'Product'},
		filter:{model:'ProductFilter'}
	}
}

module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		product:{model:'Product'},
		style:{model:'ProductStyle'}
	}
}

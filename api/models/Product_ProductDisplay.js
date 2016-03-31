module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		product:{model:'Product'},
		display:{model:'ProductDisplay'}
	}
}
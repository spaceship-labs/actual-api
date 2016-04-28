module.exports = {
	//migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
    Handle: {type:'string'},
    Code:{type:'string'},

    Products: {
      collection:'productcolor',
      through: 'product_productcolor'
    }
	}
}

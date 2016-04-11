module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
    Handle: {type:'string'},

    Filter:{
      model:'productfilter'
    },

    Products: {
      collection:'productfiltervalue',
      through: 'product_productfiltervalue'
    }
	}
}

module.exports = {
	migrate:'alter',
	//connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Description:{type:'text'},
		Keywords:{type:'string'},
		Handle:{type:'string'},
		IsMain:{type:'boolean'},
		CategoryLevel:{type:'integer'},


    Parents:{
      collection: 'productcategory',
      via:'Childs',
    },

    Childs:{
      collection: 'productcategory',
      via:'Parents',
    },

    Filters:{
      collection:'productfilter',
      via: 'Categories'
    },

    Products:{
      collection: 'Product',
      via: 'Categories'
    },


	}
}

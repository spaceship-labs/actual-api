module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Description:{type:'text'},
		Keywords:{type:'string'},
		Handle:{type:'string'},
		IsMain:{type:'boolean'},
		IsSub:{type:'boolean'},
		CategoryLevel:{type:'integer'},


    Parents:{
      collection: 'productcategory',
      via:'Child',
      through:'productcategorytree'
    },

    Childs:{
      collection: 'productcategory',
      via:'Parent',
      through:'productcategorytree'
    },

    Filters:{
      collection:'productfilter',
      through: 'productcategory_productfilter'
    },

    Products:{
      collection: 'Product',
      through: 'product_productcategory'
    },


	}
}

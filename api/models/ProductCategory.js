module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Parent:{type:'integer'},
		Description:{type:'text'},
		Keywords:{type:'string'},
		Handle:{type:'string'},
		IsMain:{type:'boolean'},
		IsSub:{type:'boolean'},
		CategoryLevel:{type:'integer'},

    Filters:{
      collection:'productfilter',
      through: 'productcategory_productfilter'
    }
	}
}

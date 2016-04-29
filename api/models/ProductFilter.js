module.exports = {
	migrate:'alter',
	connection:'mysql',
	attributes:{
		Name:{type:'string'},
		Description:{type:'text'},
    Handle:{type:'string', unique: true},
    IsMultiple: {type:'boolean'},
    ValuesOrder: {type:'string'},

    Categories:{
      collection:'productcategory',
      through: 'productcategory_productfilter'
    },

    Values: {
      collection:'productfiltervalue',
      via: 'Filter'
    }
	}
}

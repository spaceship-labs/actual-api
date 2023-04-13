//APP COLLECTION
module.exports = {
  schema: true,
	attributes:{
		Name:{type:'string'},
		Description:{type:'string'},
    Handle:{type:'string'},
    IsMultiple: {type:'boolean'},
    ValuesOrder: {type:'string'},
    IsColor:{type:'boolean'},
    Categories:{
      collection:'productcategory',
      via: 'Filters'
    },
    Values: {
      collection:'productfiltervalue',
      via: 'Filter'
    }
	}
}

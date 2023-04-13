//APP COLLECTION
module.exports = {
  schema: true,
	attributes:{
    Name:{
      type:'string'
    },
    Handle: {
      type:'string'
    },
    Keywords:{
      type:'string'
    },
    Code:{
      type:'string'
    },
    Filter:{
      model:'productfilter'
    },
    Products: {
      collection:'product',
      via: 'FilterValues'
    },
	}
};

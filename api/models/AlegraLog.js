module.exports = {
  schema: true,
	attributes:{
	  User:{
	    model: 'User'
	  },
	  Order: {
	    model:'Order'
	  },
	  Store:{
	    model: 'Store'
	  },
	  url:{
	    type:'string'
	  },
	  requestData:{
	    type:'string'
	  },
	  responseData:{
	  	type:'string'
	  },
	  isError:{
	  	type:'boolean'
	  },
	}
};
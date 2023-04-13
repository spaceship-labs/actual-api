//APP COLLECTION
module.exports = {
  //migrate:'alter',
  schema: true,
  attributes:{
    Name:{type:'string'},
    Description: {type:'string'},
    Handle: {type:'string'},
    Products:{
      collection:'product',
      via:'CustomBrand'
    },
  }
};

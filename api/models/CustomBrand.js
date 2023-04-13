//APP COLLECTION
module.exports = {
  //migrate:'alter',
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

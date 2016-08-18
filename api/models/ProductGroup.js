//APP COLLECTION
module.exports = {
  schema:true,
  migrate:'alter',
  attributes:{
    Name:{type:'string'},
    Type:{
      type:'string',
      enum:['variations','environments','packages','relations']
    },
    Handle:{
      type:'string',
      unique:true
    },
    code:{
      type:'string',
      unique:true
    },
    Description:{type:'text'},
    startDate: {type:'datetime'},
    endDate: {type:'datetime'},
    HasExpiration: {type:'boolean'},

    icon_filename:{type:'string'},
    icon_name:{type:'string'},
    icon_type:{type:'string'},
    icon_typebase:{type:'string'},
    icon_size:{type:'integer'},
    icon_description:{type:'string'},

    Products: {
      collection: 'Product',
      via: 'Groups'
    },

    //Relation promotion search
    Promotions:{
      collection: 'Promotion',
      via:'Groups'
    },

    /*-------------/
      ONLY APPLIES TO PACKAGES GROUPS
    /*------------*/
    ProductsPackageInfo: {
      collection:'ProductPackageInfo',
      via:'Package'
    },

    Stores:{
      collection:'Company',
      via:'ProductsPackages'
    }

  }
}

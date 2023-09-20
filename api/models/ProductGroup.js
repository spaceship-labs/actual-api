//APP COLLECTION
module.exports = {
  schema:true,
  migrate:'alter',
  attributes:{
    Name:{type:'string'},
    password:{type: 'string'},
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

    /*-------------/
      ONLY APPLIES TO PACKAGES GROUPS
    /*------------*/
    OnOffline:{type:'boolean'},
    OnStudio:{type:'boolean'},
    OnHome:{type:'boolean'},
    OnKids:{type:'boolean'},
    OnAmueble:{type:'boolean'},
    
    
    PackageRules: {
      collection:'PackageRule',
      via:'PromotionPackage'
    },
    Stores:{
      collection:'store',
      //collection:'Company',
      via:'PromotionPackages'
    }
  },
  beforeUpdate: function (values, next) {
    if (values.new_password) {
      sails.log.info(values.password);
      values.password = CipherService.hashPassword(values.new_password);
      sails.log.info(values.password);
    }
    next();
  },
  beforeCreate: function (values, next) {
      if (values.Password) {
        values.password = CipherService.hashPassword(values.Password);
      }
      next();
  },
};

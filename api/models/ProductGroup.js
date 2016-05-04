module.exports = {
  migrate:'alter',
  connection:'mysql',
  attributes:{
    Name:{type:'string'},
    Type:{type:'string'},
    Handle:{type:'string'},
    Description:{type:'text'},
    StartsOn: {type:'datetime'},
    EndsOn: {type:'datetime'},
    HasExpiration: {type:'boolean'},

    icon_filename:{type:'string'},
    icon_name:{type:'string'},
    icon_type:{type:'string'},
    icon_typebase:{type:'string'},
    icon_size:{type:'integer'},
    icon_description:{type:'string'},

    Products: {
      collection: 'Product',
      through: 'product_productgroup'
    }

  }
}

//APP COLLECTION
module.exports = {
  tableName: 'product_groups__productgroup_products',
  attributes:{
    product: {
      columnName:'product_Groups',
      model: 'product'
    },
    productgroup: {
      columnName:'productgroup_Products',
      model: 'productgroup'
    }
  },

  afterDestroy: function(destroyedRecords, cb){
    sails.log.info('destroyedRecords');
    sails.log.info(destroyedRecords);
    cb();
  }
};

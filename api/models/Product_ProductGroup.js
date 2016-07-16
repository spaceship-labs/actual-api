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
  }
};

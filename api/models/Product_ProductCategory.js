//APP COLLECTION
module.exports = {
  tableName: 'product_categories__productcategory_products',
  attributes:{
    productcategory_Products: {
      model: 'productCategory'
    },
    product_Categories: {
      model: 'product'
    }
  }
};

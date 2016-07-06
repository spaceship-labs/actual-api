/**
 * Product_ProductCategory.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
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

//APP COLLECTION
module.exports = {
  migrate: 'alter',
  attributes: {
    Name: { type: 'string' },
    Description: { type: 'text' },
    Keywords: { type: 'string' },
    Handle: { type: 'string' },
    IsMain: { type: 'boolean' },
    CategoryLevel: { type: 'integer' },
    productsNum: { type: 'integer' },
    customOrder: { type: 'boolean' },
    complement: {
      type: 'boolean',
    },
    onKidsMenu: {
      type: 'boolean',
    },
    Parents: {
      collection: 'productcategory',
      via: 'Childs',
    },
    Childs: {
      collection: 'productcategory',
      via: 'Parents',
    },
    Filters: {
      collection: 'productfilter',
      via: 'Categories',
    },
    Products: {
      collection: 'Product',
      via: 'Categories',
    },
  },
};

//APP COLLECTION
module.exports = {
  schema: true,
  migrate: 'alter',
  attributes: {
    Name: { type: 'string' },
    Description: { type: 'string' },
    Keywords: { type: 'string' },
    Handle: { type: 'string' },
    IsMain: { type: 'boolean' },
    CategoryLevel: { type: 'number' },
    productsNum: { type: 'number' },
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
    FeaturedProducts: {
      collection: 'Product',
      via: 'FeaturedCategories',
    },
  },
};

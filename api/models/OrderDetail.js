//APP COLLECTION
module.exports = {
  migrate: 'alter',
  attributes: {
    Order:{
      model:'Order',
    },
    Product: {
      model:'Product'
    },
    quantity: 'integer',
    discount: 'float',
    total: 'float'
  }
};

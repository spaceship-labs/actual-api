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
    Quantity: 'integer',
    discount: 'float',
    total: 'float'
  }
};

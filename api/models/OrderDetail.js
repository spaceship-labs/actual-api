//APP COLLECTION
module.exports = {
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

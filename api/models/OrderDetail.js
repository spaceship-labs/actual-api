//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    quantity: 'integer',
    discount: 'float',
    subtotal: 'float',
    total: 'float',
    discountPercent: 'float',
    paymentGroup: 'integer',
    unitPrice: 'float',
    Promotion:{
      model:'Promotion'
    },
    Order:{
      model:'Order',
    },
    Product: {
      model:'Product'
    },
    //ship
    shipDate: {
      type: 'date',
      required: true
    },
    shipCompany: {
      model: 'company',
      required: true
    }

  }
};

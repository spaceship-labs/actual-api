module.exports = {
  migrate: 'alter',
  tableName: 'QuotationDetail',
  attributes: {
    Quotation:{
      model:'Quotation',
    },
    Product: {
      model:'Product'
    },
    Quantity: 'integer',
    Discount: 'float',
  }
};

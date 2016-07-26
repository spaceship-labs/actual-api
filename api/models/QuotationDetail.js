//APP COLLECTION
module.exports = {
  schema:true,
  tableName: 'QuotationDetail',
  attributes: {
    Quotation:{
      model:'Quotation',
    },
    Product: {
      model:'Product'
    },
    quantity: 'integer',
    discount: 'float',
    subtotal: 'float',
    total: 'float'
  }
};

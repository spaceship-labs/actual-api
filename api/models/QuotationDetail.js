//APP COLLECTION
module.exports = {
  schema:true,
  tableName: 'QuotationDetail',
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
    Quotation:{
      model:'Quotation',
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
    },
    shipDateFake:{
      type:'date',
      //required:true
    },
    PromotionPackage:{
      model:'ProductGroup'
    },
  }
};

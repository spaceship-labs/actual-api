//APP COLLECTION
module.exports = {
  schema:true,
  tableName: 'QuotationDetail',
  attributes: {
    quantity: 'integer',
    discount: 'float', //total discount
    subtotal: 'float',
    subtotalWithPromotions: 'float', // includes discounts but not big ticket neither family and friends
    total: 'float',
    discountPercent: 'float', //by unit (includes big ticket discount)
    bigticketDiscount: 'float',
    bigticketDiscountPercentage: {
      type: 'integer',
      enum:[0,1,2,3,4,5]
    },
    paymentGroup: 'integer',
    unitPrice: 'float',
    unitPriceWithDiscount: 'float',
    ewallet: 'float',
    immediateDelivery: 'boolean',
    isFreeSale: 'boolean',
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
    productDate: {
      type: 'date',
      required: true
    },
    shipCompany: {
      model: 'company',
      required: true
    },
    shipCompanyFrom:{
      model:'company',
      required: true
    },
    PromotionPackage:{
      model:'ProductGroup'
    },
    PromotionPackageApplied:{
      model:'ProductGroup'
    },
  }
};

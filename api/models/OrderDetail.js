//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    quantity: 'number',
    discount: 'float',
    subtotal: 'float',
    subtotal2: 'float', // includes discounts but not big ticket neither family and friends
    total: 'float',
    totalPg1: 'float',
    financingCostPercentage: 'float',
    discountPercentPromos: 'float', //by unit (does not include big ticket or FF discount)
    discountPercent: 'float', //by unit (includes big ticket discount)
    discountName: 'string',
    originalDiscountPercent: 'float',
    clientDiscountReference: 'string',
    bigticketDiscountPercentage: {
      type: 'string',
      isIn:["0","1","2","3","4","5"]
    },
    paymentGroup: 'number',
    unitPrice: 'float',
    unitPriceWithDiscount: 'float',
    ewallet: 'float',
    immediateDelivery: 'boolean',
    ShopDelivery: 'boolean',
    WeekendDelivery: 'boolean',
    isSRService: 'boolean',
    isFreeSale: 'boolean',
    Promotion:{
      model:'Promotion'
    },
    PromotionPackage:{
      model:'ProductGroup'
    },
    PromotionPackageApplied:{
      model:'ProductGroup'
    },
    Order:{
      model:'Order',
    },
    Product: {
      model:'Product'
    },
    QuotationDetail:{
      model: 'QuotationDetail'
    },

    //ship
    shipDate: {
      type:'string', columnType:'date',
      required: true
    },
    originalShipDate: {
      type:'string', columnType:'date',
      required: true
    },
    productDate: {
      type:'string', columnType:'date',
      required: true
    },
    shipCompany: {
      model: 'company',
      required: true
    },
    shipCompanyFrom: {
      model: 'company',
      required: true
    },

    PurchaseAfter: {type:'boolean'},
    PurchaseDocument: {type:'string'},

  },

};

//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    quantity: { type: 'number' },
    discount: { type: 'number', columnType: 'float' },
    subtotal: { type: 'number', columnType: 'float' },
    subtotal2: { type: 'number', columnType: 'float' }, // includes discounts but not big ticket neither family and friends
    total: { type: 'number', columnType: 'float' },
    totalPg1: { type: 'number', columnType: 'float' },
    financingCostPercentage: { type: 'number', columnType: 'float' },
    discountPercentPromos: { type: 'number', columnType: 'float' }, //by unit (does not include big ticket or FF discount)
    discountPercent: { type: 'number', columnType: 'float' }, //by unit (includes big ticket discount)
    discountName: { type: 'string' },
    originalDiscountPercent: { type: 'number', columnType: 'float'},
    clientDiscountReference: { type: 'string' },
    bigticketDiscountPercentage: {
      type: 'string',
      isIn:["0","1","2","3","4","5"]
    },
    paymentGroup: {type: 'number' },
    unitPrice: { type: 'number', columnType: 'float' },
    unitPriceWithDiscount: { type: 'number', columnType: 'float' },
    ewallet: { type: 'number', columnType: 'float' },
    immediateDelivery: {type: 'boolean' },
    ShopDelivery: { type: 'boolean' },
    WeekendDelivery: { type: 'boolean' },
    isSRService: { type: 'boolean' },
    isFreeSale: { type: 'boolean' },
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

//APP COLLECTION
module.exports = {
  schema:true,
  tableName: 'QuotationDetail',
  attributes: {
    quantity: {
      type: 'number',
    },
    discount: {
      type: 'number',
      columnType: 'float',
    },
    //total discount
    subtotal: {
      type: 'number',
      columnType: 'float',
    },
    // includes discounts but not big ticket neither family and friends
    subtotal2: {
      type: 'number',
      columnType: 'float',
    },
    total: {
      type: 'number',
      columnType: 'float',
    },
    totalPg1: {
      type: 'number',
      columnType: 'float',
    },
    financingCostPercentage: {
      type: 'number',
      columnType: 'float',
    },
    discountPercentPromos: {
      type: 'number',
      columnType: 'float', //by unit (does not include big ticket or FF discount)
    },
    discountPercent: {
      type: 'number',
      columnType: 'float', //by unit (includes big ticket or FF discount)
    },
    discountName: {
      type: 'string',
    },
    originalDiscountPercent: {
      type: 'number',
      columnType: 'float',
    },
    clientDiscountReference: {
      type: 'string',
    },
    bigticketDiscountPercentage: {
      type:'string',
      isIn:["0","1","2","3","4","5"]
    },
    paymentGroup: {
      type: 'number',
    },
    unitPrice: {
      type: 'number',
      columnType: 'float',
    },
    unitPriceWithDiscount: {
      type: 'number',
      columnType: 'float',
    },
    ewallet: {
      type: 'number',
      columnType: 'float',
    },
    immediateDelivery: {
      type: 'boolean',
    },
    ShopDelivery: {
      type: 'boolean',
    },
    WeekendDelivery: {
      type: 'boolean',
    },
    isSRService: {
      type: 'boolean',
    },
    isFreeSale: {
      type: 'boolean',
    },
    force: {
      type: 'boolean',
    },
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
    shipCompanyFrom:{
      model:'company',
      required: true
    },

    PurchaseAfter: {type:'boolean'},
    PurchaseDocument: {type:'string'},

    PromotionPackage:{
      model:'ProductGroup'
    },
    PromotionPackageApplied:{
      model:'ProductGroup'
    },
  },

};

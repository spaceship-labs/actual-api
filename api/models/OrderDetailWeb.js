//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    inSapWriteProgress: 'boolean',
    quantity: 'number',
    discount: 'number', columnType: 'float',
    subtotal: 'number', columnType: 'float',
    subtotal2: 'number', columnType: 'float', // includes discounts but not big ticket neither family and friends
    total: 'number', columnType: 'float',
    totalPg1: 'number', columnType: 'float',
    totalPg2: 'number', columnType: 'float',
    totalPg3: 'number', columnType: 'float',
    totalPg4: 'number', columnType: 'float',
    totalPg5: 'number', columnType: 'float',

    discountPg1: 'number', columnType: 'float',
    discountPg2: 'number', columnType: 'float',
    discountPg3: 'number', columnType: 'float',
    discountPg4: 'number', columnType: 'float',
    discountPg5: 'number', columnType: 'float',

    isSpeiOrderDetail: 'boolean',
    speiExpirationPayment: {type:'string',columnType:'datetime'},

    financingCostPercentage: 'number', columnType: 'float',
    discountPercentPromos: 'number', columnType: 'float', //by unit (does not include big ticket or FF discount)
    discountPercent: 'number', columnType: 'float', //by unit (includes big ticket discount)
    discountName: 'string',
    originalDiscountPercent: 'number', columnType: 'float',
    unitPriceWithDiscount: 'number', columnType: 'float',
    bigticketDiscountPercentage: {
      type: 'string',
      isIn:["0","1","2","3","4","5"]
    },
    paymentGroup: 'number',
    unitPrice: 'number', columnType: 'float',
    ewallet: 'number', columnType: 'float',
    immediateDelivery: 'boolean',
    ShopDelivery: 'boolean',
    WeekendDelivery: 'boolean',
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
    shipCompanyFrom: {
      model: 'company',
      required: true
    },
    PurchaseAfter: {type:'boolean'},
    PurchaseDocument: {type:'string'}

  },

};

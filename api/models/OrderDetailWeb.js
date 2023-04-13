//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    inSapWriteProgress: { type: 'boolean' },
    quantity: { type: 'number' },
    discount: { type: 'number', columnType: 'float' },
    subtotal: { type: 'number', columnType: 'float' },
    subtotal2: { type: 'number', columnType: 'float' }, // includes discounts but not big ticket neither family and friend }s
    total: { type: 'number', columnType: 'float' },
    totalPg1: { type: 'number', columnType: 'float' },
    totalPg2: { type: 'number', columnType: 'float' },
    totalPg3: { type: 'number', columnType: 'float' },
    totalPg4: { type: 'number', columnType: 'float' },
    totalPg5: { type: 'number', columnType: 'float' },

    discountPg1: { type: 'number', columnType: 'float' },
    discountPg2: { type: 'number', columnType: 'float' },
    discountPg3: { type: 'number', columnType: 'float' },
    discountPg4: { type: 'number', columnType: 'float' },
    discountPg5: { type: 'number', columnType: 'float' },

    isSpeiOrderDetail: { type: 'boolean' },
    speiExpirationPayment: {type:'string',columnType:'datetime'},

    financingCostPercentage: { type: 'number', columnType: 'float' },
    discountPercentPromos: { type: 'number', columnType: 'float' }, //by unit (does not include big ticket or FF discount)
    discountPercent: { type: 'number', columnType: 'float' }, //by unit (includes big ticket discount)
    discountName: { type: 'string' },
    originalDiscountPercent: { type: 'number', columnType: 'float' },
    unitPriceWithDiscount: { type: 'number', columnType: 'float' },
    bigticketDiscountPercentage: {
      type: 'string',
      isIn:["0","1","2","3","4","5"]
    },
    paymentGroup: { type: 'number' },
    unitPrice: { type: 'number', columnType: 'float' },
    ewallet: { type: 'number', columnType: 'float' },
    immediateDelivery: { type: 'boolean' },
    ShopDelivery: { type: 'boolean' },
    WeekendDelivery: { type: 'boolean' },
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

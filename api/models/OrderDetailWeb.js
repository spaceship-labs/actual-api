//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    inSapWriteProgress: 'boolean',
    quantity: 'integer',
    discount: 'float',
    subtotal: 'float',
    subtotal2: 'float', // includes discounts but not big ticket neither family and friends
    total: 'float',
    totalPg1: 'float',
    totalPg2: 'float',
    totalPg3: 'float',
    totalPg4: 'float',
    totalPg5: 'float',

    discountPg1: 'float',
    discountPg2: 'float',
    discountPg3: 'float',
    discountPg4: 'float',
    discountPg5: 'float',

    isSpeiOrderDetail: 'boolean',
    speiExpirationPayment: {type:'datetime'},    

    financingCostPercentage: 'float',
    discountPercentPromos: 'float', //by unit (does not include big ticket or FF discount)    
    discountPercent: 'float', //by unit (includes big ticket discount)
    discountName: 'string',    
    originalDiscountPercent: 'float',   
    unitPriceWithDiscount: 'float',
    bigticketDiscountPercentage: {
      type: 'integer',
      enum:[0,1,2,3,4,5]
    },    
    paymentGroup: 'integer',
    unitPrice: 'float',
    ewallet: 'float',
    immediateDelivery: 'boolean',
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
      type: 'date',
      required: true
    },
    originalShipDate: {
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
    shipCompanyFrom: {
      model: 'company',
      required: true
    },
    PurchaseAfter: {type:'boolean'},
    PurchaseDocument: {type:'string'}    

  },

};

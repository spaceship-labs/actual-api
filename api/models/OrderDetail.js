//APP COLLECTION
module.exports = {
  schema: true,
  migrate: 'alter',
  attributes: {
    quantity: 'integer',
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
      type: 'integer',
      enum: [0, 1, 2, 3, 4, 5],
    },
    paymentGroup: 'integer',
    unitPrice: 'float',
    unitPriceWithDiscount: 'float',
    ewallet: 'float',
    immediateDelivery: 'boolean',
    isSRService: 'boolean',
    isFreeSale: 'boolean',
    status: {
      type: 'string',
      enum: ['paid', 'partiallyCanceled', 'canceled'],
    },
    quantityCanceled: {
      type: 'integer',
      defaultsTo: 0,
    },
    quantityAvailable: {
      type: 'integer',
      defaultsTo: 0,
    },
    CancelationOrders: {
      collection: 'OrderCancelation',
      via: 'Details',
    },
    Promotion: {
      model: 'Promotion',
    },
    PromotionPackage: {
      model: 'ProductGroup',
    },
    PromotionPackageApplied: {
      model: 'ProductGroup',
    },
    Order: {
      model: 'Order',
    },
    Product: {
      model: 'Product',
    },
    QuotationDetail: {
      model: 'QuotationDetail',
    },
    CancelationDetails: {
      collection: 'OrderDetailCancelation',
      via: 'Detail',
    },
    cancelationsSap: {
      collection: 'CancelationSap',
      via: 'Details',
    },
    //ship
    shipDate: {
      type: 'date',
      required: true,
    },
    originalShipDate: {
      type: 'date',
      required: true,
    },
    productDate: {
      type: 'date',
      required: true,
    },
    shipCompany: {
      model: 'company',
      required: true,
    },
    shipCompanyFrom: {
      model: 'company',
      required: true,
    },

    PurchaseAfter: { type: 'boolean' },
    PurchaseDocument: { type: 'string' },
  },
};

/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
  schema: true,
  migrate: 'alter',
  attributes: {
    name: {
      type: 'string',
    },
    group: {
      type: 'string',
      isIn: ['home', 'studio', 'kids', 'proyectos'],
    },
    logo: {
      type: 'string',
    },
    code: { type: 'string' },
    web: { type: 'boolean' },
    marketplace: { type: 'boolean' },

    //RELATIONS
    users: {
      collection: 'user',
      via: 'Stores',
    },
    Warehouse: {
      model: 'Company',
    },
    Payments: {
      collection: 'Payment',
      via: 'Store',
    },
    Quotations: {
      collection: 'Quotation',
      via: 'Store',
    },
    Orders: {
      collection: 'Order',
      via: 'Store',
    },
    PromotionPackages: {
      collection: 'ProductGroup',
      via: 'Stores',
    },
    PaymentsWeb: {
      collection: 'PaymentWeb',
      via: 'Store',
    },
  },
};

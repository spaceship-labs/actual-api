/**
 * CancelationSap.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    type: {
      type: 'string',
    },
    result: {
      type: 'string',
    },
    Payments: {
      collection: 'PaymentSap',
      via: 'CancelationSap',
    },
    PaymentsCancel: {
      collection: 'PaymentCancelSap',
      via: 'CancelationSap',
    },
    series: {
      type: 'string',
    },
    CancelationOrder: {
      model: 'OrderCancelation',
    },
    Products: {
      collection: 'Product',
      via: 'CancelationSap',
      columnName: 'products',
    },
  },
};

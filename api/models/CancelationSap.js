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
      collection: 'Payment',
      via: 'cancelationsSapRef',
    },
    PaymentsCancel: {
      collection: 'Payment',
      via: 'canceledSap',
    },
    series: {
      type: 'string',
    },
    CancelationsOrder: {
      collection: 'OrderCancelation',
      via: 'CancelationsSap',
      columnName: 'RequestTransfer',
    },
    Products: {
      collection: 'Product',
      via: 'CancelationsSap',
    },
  },
};

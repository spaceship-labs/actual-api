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
    DocEntry: {
      type: 'string',
    },
    BaseRef: {
      type: 'string',
    },
    Details: {
      collection: 'OrderDetail',
      via: 'cancelationsSap',
    },
    Payments: {
      collection: 'PaymentSap',
      via: 'CancelationSap',
    },
    PaymentsCancel: {
      collection: 'PaymentCancelSap',
      via: 'CancelationSap',
    },
    Order: {
      model: 'Order',
    },
    CancelationOrder: {
      model: 'OrderCancelation',
    },
    Products: {
      collection: 'Product',
      via: 'CancelationSap',
    },
    cancelDocSap: {
      collection: 'CancelDocSap',
      via: 'cancelationSap',
    },
  },
};

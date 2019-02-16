/**
 * PaymentCancelSap.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    document: {
      type: 'string',
    },
    Order: {
      model: 'Order',
    },
    OrderSap: {
      model: 'OrderSap',
    },
    CancelationOrder: {
      model: 'CancelationOrder',
    },
    Payment: {
      model: 'Payment',
    },
    CancelationSap: {
      model: 'CancelationSap',
    },
  },
};

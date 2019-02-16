/**
 * CancelDocSap.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    type: {
      type: 'string',
    },
    value: {
      type: 'string',
    },
    order: {
      model: 'Order',
    },
    cancelOrder: {
      type: 'OrderCancelation',
    },
  },
};

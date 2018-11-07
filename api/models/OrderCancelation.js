/**
 * OrderCancelation.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    cancelAll: {
      type: 'boolean',
    },
    reason: {
      type: 'text',
    },
    // Relations
    Details: {
      collection: 'OrderDetail',
      via: 'Cancelation',
    },
    Order: {
      model: 'Order',
    },
  },
};

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
    status: {
      type: 'string',
      enum: ['requested', 'reviewed'],
    },
    // Relations
    Details: {
      collection: 'OrderDetail',
      via: 'CancelationOrder',
    },
    Order: {
      model: 'Order',
    },
  },
};
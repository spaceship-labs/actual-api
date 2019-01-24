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
      enum: ['pending', 'reviewed'],
      defaultsTo: 'pending',
    },
    // Relations
    CardName: {
      type: 'string',
    },
    Order: {
      model: 'Order',
    },
    Quotation: {
      model: 'Quotation',
    },
    Details: {
      collection: 'OrderDetail',
      via: 'CancelationOrders',
    },
    CancelationDetails: {
      collection: 'OrderDetailCancelation',
      via: 'Cancelation',
    },
    CancelationSap: {
      model: 'CancelationSap',
    },
  },
};

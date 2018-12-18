/**
 * OrderDetailCancelation.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    status: {
      type: 'string',
      enum: ['pending', 'authorized', 'rejected'],
      defaultsTo: 'pending',
    },
    quantity: {
      type: 'integer',
    },
    Order: {
      model: 'Order',
    },
    Cancelations: {
      collection: 'OrderCancelation',
      via: 'CancelationDetails',
    },
    Detail: {
      model: 'OrderDetail',
    },
  },
};

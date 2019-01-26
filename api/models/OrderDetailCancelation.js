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
    total: {
      type: 'float',
    },
    shipDate: {
      type: 'string',
      required: true,
    },
    Product: {
      model: 'Product',
    },
    shipCompanyFrom: {
      model: 'Company',
      required: true,
    },
    Order: {
      model: 'Order',
      required: true,
    },
    Cancelation: {
      model: 'OrderCancelation',
    },
    Detail: {
      model: 'OrderDetail',
    },
  },
};

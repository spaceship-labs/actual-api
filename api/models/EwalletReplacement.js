/**
 * EwalletReplacement.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    status: {
      type: 'string',
      enum: ['pending', 'approved', 'rejected'],
      defaultsTo: 'pending',
    },
    approvedAt: {
      type: 'datetime',
    },
    amount: {
      type: 'float',
    },
    // Relations
    Ewallet: {
      model: 'Ewallet',
    },
    Client: {
      model: 'Client',
    },
    Store: {
      model: 'Store',
    },
    Files: {
      collection: 'replacementfile',
      via: 'Replacement',
    },
    requestedBy: {
      model: 'User',
    },
    approvedBy: {
      model: 'User',
    },
  },
};

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
      enum: ['pending', 'approved'],
      defaultsTo: 'pending',
    },
    approvedAt: {
      type: 'datetime',
    },
    fileUrl: {
      type: 'string',
    },
    // Relations
    Client: {
      model: 'Client',
    },
    Store: {
      model: 'Store',
    },
    requestedBy: {
      model: 'User',
    },
    approvedBy: {
      model: 'User',
    },
  },
};

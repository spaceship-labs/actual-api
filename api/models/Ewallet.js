/**
 * Ewallet.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  schema: true,
  migrate: 'alter',
  attributes: {
    cardNumber: {
      type: 'string',
      required: true,
      unique: true,
    },
    amount: {
      type: 'float',
      required: true,
      defaultsTo: 0,
    },
    active: {
      type: 'boolean',
      defaultsTo: true,
    },
    // RELATIONS
    Records: {
      collection: 'EwalletRecord',
      via: 'Ewallet',
    },
    Client: {
      model: 'Client',
    },
    Contract: {
      collection: 'EwalletFile',
      via: 'Ewallet',
    },
    Store: {
      model: 'Store',
    },
  },
};

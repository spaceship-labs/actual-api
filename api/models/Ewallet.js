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
    },
    amount: {
      type: 'float',
      required: true,
    },
    active: {
      type: 'boolean',
    },
    // RELATIONS
    Records: {
      collection: 'EwalletRecord',
      via: 'Ewallet',
    },
    Client: {
      model: 'Client',
    },
    Store: {
      model: 'Store',
    },
  },
};

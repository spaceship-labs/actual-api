/**
 * EwalletConfiguration.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  migrate: 'alter',
  attributes: {
    exchangeRate: {
      type: 'float',
    },
    expirationDate: {
      type: 'datetime',
    },
    maximumPercentageToGeneratePoints: {
      type: 'float',
    },
    emailSent: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
};

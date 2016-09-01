/**
 * Commission.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    user: {
      model: 'user',
      required: true
    },
    rate: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    ammount: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    ammountPayment: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    payment: {
      model: 'payment',
      required: true,
    }
  }
};


/**
 * Commission.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    folio: {
      type: 'integer',
      required: true
    },
    datePayment: {
      type: 'date',
    },
    ammountPayment: {
      type: 'float',
      required: true,
      defaultsTo: 0
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
    ammountPaid: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    ammountLeft: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    user: {
      model: 'user',
      required: true
    },
    payment: {
      model: 'payment',
      required: true
    }
  },
  beforeValidate: function(val, cb){
    Common.orderCustomAI(val, 'commissionFolio', function(val){
      cb();
    });
  },
};


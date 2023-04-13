/**
 * Commission.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  schema: true,
  attributes: {
    folio: {
      type: 'number',
      required: true
    },
    datePayment: {
      type: 'string',
      columnType:'date'
    },
    ammountPayment: {
      type: 'number', columnType: 'float',
      defaultsTo: 0
    },
    rate: {
      type: 'number', columnType: 'float',
      defaultsTo: 0
    },
    ammount: {
      type: 'number', columnType: 'float',
      defaultsTo: 0
    },
    status: {
      type: 'string',
      isIn: ['paid', 'pending'],
      defaultsTo: 'pending'
    },
    store: {
      model: 'store',
      required: true
    },
    user: {
      model: 'user',
      required: true
    },
    role: {
      type: 'string',
      isIn: ['seller', 'store manager'],
    },
    payment: {
      model: 'payment',
      required: true
    },
  },
  toJSON: function () {
    var obj = this.toObject();
    obj.order = obj.payment.Order;
    obj.quotation = obj.payment.Quotation;
    return obj;
  },
  beforeValidate: function (val, cb) {
    Common.orderCustomAI(val, 'commissionFolio', function (val) {
      cb();
    });
  },
};


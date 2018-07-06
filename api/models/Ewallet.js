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
      requiered: true
    },
    movement: {
      type: 'string',
      enum: ['increase', 'decrease']
    },
    increase: {
      type: 'integer'
    },
    decrease : {
      type: 'integer'
    },
    amount: {
      type: 'integer'
    },
    Store:{
      model:'store'
    },
    Order:{
      model:'Order'
    },
    Quotation:{
      model:'Quotation'
    },
    QuotationDetail:{
      model:'QuotationDetail'
    },
    User:{
      model:'User'
    },
    Payment:{
      model: 'Payment'
    }
  }
};


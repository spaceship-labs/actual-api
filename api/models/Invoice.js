/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    alegraId: {
      type:'integer'
    },
    order: {
      model: 'order',
      required: true,
    }
  },
  autoPK: false,
};


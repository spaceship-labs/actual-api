/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    invoice_uid: {
      type: 'string',
    },
    order: {
      model: 'order',
      required: true,
    },
    folio: {
      type: 'integer',
    },
    calcelled: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
};

/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    folio: {
      type: 'string',
    },
    order: {
      model: 'order',
      required: true,
    },
    numeroReferencia: {
      type: 'integer',
    },
    calcelled: {
      type: 'boolean',
      defaultsTo: false,
    },
  },
};

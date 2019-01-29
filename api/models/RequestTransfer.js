/**
 * RequestTransfer.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    document: {
      type: 'string',
    },
    CancelationSap: {
      model: 'CancelationSap',
    },
  },
};

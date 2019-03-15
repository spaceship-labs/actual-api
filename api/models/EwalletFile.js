/**
 * EwalletFile.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    filename: {
      type: 'string',
    },
    filepath: {
      type: 'string',
    },
    Client: {
      model: 'Client',
    },
    Ewallet: {
      model: 'Ewallet',
    },
  },
};

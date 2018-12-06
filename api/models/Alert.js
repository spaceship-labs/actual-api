/**
 * Alert.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    message: {
      type: 'text',
    },

    // Relations
    userFrom: {
      model: 'User',
    },
    userTo: {
      model: 'User',
    },
  },
};

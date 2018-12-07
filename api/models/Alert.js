/**
 * Alert.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    subject: {
      type: 'string',
    },
    message: {
      type: 'text',
    },
    userCode: {
      type: 'integer',
      enum: [1, 2, 3, 4],
    },
    notificationID: {
      type: 'string',
    },
  },
};

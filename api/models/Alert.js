/**
 * Alert.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    notificationType: {
      type: 'integer',
    },
    folio: {
      type: 'text',
    },
    link: {
      type: 'string',
    },
    notificationID: {
      type: 'string',
    },
    Order: {
      model: 'Order',
    },
  },
};

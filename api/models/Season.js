/**
 * Season.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'Dates',
  schema: true,
  attributes: {
    idDates: {
      type: 'number',
      required: true
    },
    StartDate: {
      type:'string', columnType:'date',
      required: true
    },
    EndDate: {
      type:'string', columnType:'date',
      required: true
    },
    Days: {
      type: 'number'
    },
    Active: {
      type: 'string'
    }
  }
};


/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
module.exports = {
  tableName: 'Serie',
  attributes: {
    //sap fields
    series: {
      columnName: 'Series',
      type: 'integer'
    },
    objectCode: {
      columnName: 'ObjectCode',
      type: 'string'
    },
    seriesName: {
      columnName: 'SeriesName',
      type: 'string'
    },
    beginStr: {
      columnName: 'BeginStr',
      type: 'string'
    },
    docSubType: {
      columnName: 'DocSubType',
      type: 'string'
    },
    //relations
    users: {
      collection: 'user',
      via: 'companies'
    }
  }
};


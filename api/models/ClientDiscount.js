/**
 * DatesDelivery.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'Descsn',
  schema: true,
  attributes: {
    Code: 'string',
    Name: 'string',
    U_ScoreCard: 'string',
    U_Sociedad: 'string',
    U_FijoMovil: 'string',
    U_Porcentaje: 'float',
    U_VigDesde: 'datetime',
    U_VigHasta: 'datetime',
    lastModified: 'datetime'
  }
};


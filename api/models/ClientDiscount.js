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
    U_SocioNegocio: 'string',
    U_Sociedad: 'string',
    U_FijoMovil: 'string',
    U_Porcentaje: { type: 'number', columnType: 'float' },
    U_Porcentaje2: { type: 'number', columnType: 'float' },
    U_VigDesde: { type: 'string', columnType: 'datetime' },
    U_VigHasta: { type: 'string', columnType: 'datetime' },
    lastModified: { type: 'string', columnType: 'datetime' }
  }
};


/**
* Order.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
/* campos default : _id, createdAt, updatedAt */
module.exports = {
  attributes: {
    name : 'string'
    ,seq : 'integer'
  }
  ,migrate : "alter"
}

/**
 * UserAcl.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  migrate:'safe',
  connection: 'mysql',
  attributes: {
      name : {
          type : 'string'
      },
      users : {
          collection : 'userACL',
          via : 'role'
      },
      /*
      permissions : {
          type : 'json'
      }
      */
  }
};


/**
 * RoleController
 *
 * @description :: Server-side logic for managing Roles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Role.find().exec(function(err, roles) {
      if (err) {return res.negotiate(err);}
      return res.json(roles);
    });
  }
};


/**
 * PermissionController
 *
 * @description :: Server-side logic for managing permissions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Permission.find().exec(function(err, permissions) {
      if (err) {return res.negotiate(err);}
      return res.json(permissions);
    });
  }
};


var _ = require('underscore');

module.exports = function (req, res, next) {
  var user       = req.user.id;
  var controller = req.options.controller;
  var action     = req.options.action;
  sails.log.info('Doing isAllowed policy');
  Permission.find({
    action: action,
    controller: controller
  })
    .populate('owners')
    .exec(function(err, permissions) {
      var allowed = _.find(permissions || [], function(permission){
        var owners = permission.owners.map(function(owner){
          return owner.id;
        });
        return owners.indexOf(user) !== -1;
      });
      if (!allowed) {
        return res.unauthorized('user is not authorized');
      } else {
        next();
      }
    });
};

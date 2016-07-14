var _ = require('underscore');
Array.prototype.find = _.find;

module.exports = function (req, res, next) {
  var user       = req.user.id;
  var controller = req.options.controller;
  var action     = req.options.action;
  Permission.find({
    action: action,
    controller: controller
  })
    .populate('owners')
    .exec(function(err, permissions) {
      var allowed = (permissions || []).find(function(permission){
        return (permission.owners || []).indexOf(user) !== -1;
      });
      if (!allowed) {
        return res.unauthorized('user is not authorized');
      } else {
        next();
      }
    });
};

var _ = require('underscore');

module.exports = function (req, res, next) {
  var user       = req.user;
  var SELLER_ROLE_NAME = 'seller';
  var ADMIN_ROLE_NAME = 'admin';

  if(user.role.name === SELLER_ROLE_NAME || user.role.name === ADMIN_ROLE_NAME){
    next();
  }else{
    return res.unauthorized('user is not authorized');
  }

};

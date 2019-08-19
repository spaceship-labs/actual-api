module.exports = function(req, res, next) {
  const user = req.user;
  const ADMIN_ROLE_NAME = 'admin';
  const STORE_MANAGER_ROLE_NAME = 'store manager';

  if (
    user.role.name === ADMIN_ROLE_NAME ||
    user.role.name === STORE_MANAGER_ROLE_NAME
  ) {
    next();
  } else {
    return res.unauthorized('user is not authorized');
  }
};

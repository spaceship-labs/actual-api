const passport = require('passport');
module.exports = function (req, res, next) {
    passport.authenticate('jwt', function (error, user, info) {
      if (error) return res.serverError(error);
      if (!user || user.role.name !== 'store manager'){
        return res.unauthorized(null, info && info.code, info && info.message);
      }
      req.user = user;
      next();
    })(req, res);
};

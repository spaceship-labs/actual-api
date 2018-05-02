var passport = require('passport');

function _onPassportAuth(req, res, error, user, info) {
  if (error) return res.serverError(error);
  if (!user)
    return res.unauthorized(null, info && info.code, info && info.message);

  /*Active store*/
  var form = req.allParams();
  var activeStoreId = form.activeStore || false;
  var updateParams = {
    lastLogin: new Date()
  };

  if (activeStoreId) {
    updateParams.activeStore = activeStoreId;
  }

  User.update(user.id, updateParams)
    .then(function(users) {
      return users[0];
    })
    .then(function(userUpdated) {
      /*Logging stuff*/
      var message = userUpdated.firstName + ' ingresó al sistema';
      var action = 'login';
      return [
        Logger.log(userUpdated.id, message, action),
        Store.findOne({ id: activeStoreId })
      ];
    })
    .spread(function(log, store) {
      if (store) {
        user.activeStore = store.id;
      }
      return res.ok({
        token: CipherService.createToken(user),
        user: user
      });
    })
    .catch(function(err) {
      return res.negotiate(err);
    });
}

module.exports = {
  signin(req, res) {
    passport.authenticate('local', _onPassportAuth.bind(this, req, res))(
      req,
      res
    );
  },

  authorizeManager: function(req, res) {
    var form = req.params.all();
    var email = form.email;
    var password = form.password;
    User.findOne({ email: email })
      .populate('role')
      .then(function(user) {
        if (
          !user ||
          !CipherService.comparePassword(password, user) ||
          user.role.name != 'store manager'
        ) {
          return res.unauthorized();
        }
        delete user.password;
        return res.json(user);
      })
      .catch(function(err) {
        res.negotiate(err);
      });
  },

  homeStatus(req, res) {
    const status =
      process.env.MODE !== 'production' ? 'ok sandbox!' : 'ok production!';
    res.ok({ status, version: '1.1.7' });
  }
};

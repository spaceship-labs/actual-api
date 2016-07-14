/**
 * AuthController
 *
 * @description :: Server-side logic for managing Auths
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var passport = require('passport');
/**
 * Triggers when user authenticates via passport
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @param {Object} error Error object
 * @param {Object} user User profile
 * @param {Object} info Info if some error occurs
 * @private
 */
function _onPassportAuth(req, res, error, user, info){
  sails.log.info('_onPassportAuth');
  sails.log.info(error);
  sails.log.info(user);
  sails.log.info(info);
  if(error) return res.serverError(error);
  if(!user) return res.unauthorized(null, info && info.code, info && info.message);

  /*Logging stuff*/
  var message    = user.firstName + ' ingresó al sistema';
  var action     = 'login';
  Logger.log(user.id, message, action).then(function(log) {
    return res.ok({
      token: CipherService.createToken(user),
      user: user
    });
  }).catch(function(err) {
    return res.negotiate(err);
  });
}



module.exports = {

  /**
   * Sign in by local strategy in passport
   * @param {Object} req Request object
   * @param {Object} res Response object
   */
  signin: function (req, res) {
    sails.log.info('signin');
    passport.authenticate('local',
      _onPassportAuth.bind(this, req, res))(req, res);
  },

  homeStatus: function(req, res){
    res.ok({status:'ok!'});
  }

};


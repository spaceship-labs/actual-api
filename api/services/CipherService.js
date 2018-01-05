var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');

module.exports = {
  secret: sails.config.jwtSettings.secret,
  issuer: sails.config.jwtSettings.issuer,
  audience: sails.config.jwtSettings.audience,


  /**
  * Hash any password
  * @param {string} password
  */
  hashPassword: function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  },

  /**
   * Compare user password hash with unhashed password
   * @param {string} password
   * @param {Object User} user
   * @returns boolean indicating a match
   */
  comparePassword: function(password, user){
    return bcrypt.compareSync(password, user.password);
  },

  /**
   * Create a token based on the passed user
   * @param {Object User} user
   */
  createToken: function(user){

    //TODO verificar si borrar el password es optimo
    delete user.password;

    return jwt.sign(
      {user: user.toJSON()},
      sails.config.jwtSettings.secret,
      {
        algorithm: sails.config.jwtSettings.algorithm,
        expiresIn: sails.config.jwtSettings.expiresIn,
        issuer: sails.config.jwtSettings.issuer,
        audience: sails.config.jwtSettings.audience
      }
    );
  }

}

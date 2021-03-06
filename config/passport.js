var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var Promise = require('bluebird');

var EXPIRES_IN = 60*60*8; //seconds (8hrs)
var SECRET = process.env.tokenSecret || "4ukI0uIVnB3iI1yxj646fVXSE3ZVk4doZgz6fTbNg7jO41EAtl20J5F7Trtwe7OM";
var ALGORITHM = "HS256";
var ISSUER = "actual.com";
var AUDIENCE = "actual.com";

var LOCAL_STRATEGY_CONFIG = {
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false
};

var JWT_STRATEGY_CONFIG = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: SECRET,
  issuer: ISSUER,
  audience: AUDIENCE
};

function _onLocalStrategyAuth(email, password, next){
  User.findOne({email: email})
    .populate('role')
    .populate('Seller')
    .exec(function(error, user){
      if (error) return next(error, false, {});
      if (!user) return next(null, false,{
        code: 'INCORRECT_AUTHDATA',
        message:'Incorrect auth data'
      });

      if(!user.active){
        return next(null, false, {
          code: 'USER_NOT_ACTIVE',          
          message: 'USER NOT ACTIVE'
        });        
      }    

      if(user.webUser){
        return next(null, false, {
          code: 'WEB_USER_NOT_AUTHORIZED',          
          message: 'WEB USER NOT AUTHORIZED'
        });        
      }              

      //TODO: replace with new cipher service type
      if( !CipherService.comparePassword(password, user) ){
        return next(null, false, {
          code: 'INCORRECT_AUTHDATA',
          message:'Incorrect auth data'        
        });
      }

      User.update({id : user.id},{ lastLogin : new Date() })
        .exec(function(err,ruser){
          if (error) return next(error, false, {});

          delete user.password;
          return next(null, user, {});
        });

  });
}

//Triggers when user authenticates via JWT strategy
function _onJwtStrategyAuth(payload, next){
  var payloadUser = payload.user || {};
  var userId = payloadUser.id || false;
  var activeStoreId = payloadUser.activeStore || false;

  if(!userId){
    return next(null, false, {
      code: 'USER_ID_UNDEFINED',
      message: 'USER ID UNDEFINED'
    });
  }

  var promises = [
    User.findOne({id:userId})
      .populate('role')
      .populate('Seller'),
  ];

  if(activeStoreId){
    promises.push( Store.findOne({id: activeStoreId}) );
  }

  return Promise.all(promises)
    .then(function(results){
      var user = results[0];
      var activeStore = results[1];

      if(activeStore){
        user.activeStore = activeStore;
      }

      if(!user.active){
        return next(null, false, {
          code: 'USER_NOT_ACTIVE',
          message: 'USER NOT ACTIVE'
        });        
      }

      if(user.webUser){
        return next(null, false, {
          code: 'WEB_USER_NOT_AUTHORIZED',          
          message: 'WEB USER NOT AUTHORIZED'
        });        
      }      

      return next(null, user, {});
    })
    .catch(function(err){
      console.log('err', err);
      return next(err, false, {
        message: 'USER NOT FOUND'
      });
    });
  

}

passport.use(
  new LocalStrategy(LOCAL_STRATEGY_CONFIG, _onLocalStrategyAuth)
);

passport.use(
  new JwtStrategy(JWT_STRATEGY_CONFIG, _onJwtStrategyAuth)
);

module.exports = {
  jwtSettings: {
    expiresIn: EXPIRES_IN,
    secret: SECRET,
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE
  },
  express:{
    customMiddleware: function(app){
      var timeout = require('connect-timeout');
      var timeoutSeconds = 36000;
      var express = require('express');
      app.use(express.compress());      
      app.use(timeout(timeoutSeconds+'s'));
      app.use(Files.middleware);
    }
  }
};

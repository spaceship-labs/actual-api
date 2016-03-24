/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bcrypt = require('bcrypt');

module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'user';
    var searchFields = ['firstName','email'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    User.find({id:id}).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        if(results.length > 0){
          res.ok({data:results[0]});
        }else{
          res.notFound();
        }
      }
    });
  },

  create: function(req, res){
    User
      .create(_.omit(req.allParams(), 'id'))
      .exec(function(err,_user){
        if(err){
          console.log(err);
          //throw(err);
          return res.serverError;
        }else{
          console.log(_user);
          return res.ok({user:_user});
        }
      })
  },

  update: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    delete form.password;
    User.update({id:id},form,function(err,user){
      if(err) console.log(err); //throw(err);
      return res.ok({
        user: user
      })
    });
  },

  send_password_recovery: function(req, res){
    var form = req.params.all();
    var email = form.email || false;
    if(email && Common.validateEmail(email) ){
      User.findOne( {email:email}, {select: ['id', 'password', 'email']} ).exec(function(err,user){
        if(err || typeof user == 'undefined'){
          console.log(err);
          return res.notFound();
        }else{
          var values = user.id + user.email + user.password;
          var tokenAux = bcrypt.hashSync(values ,bcrypt.genSaltSync(10));
          var token = tokenAux;
          //var token = tokenAux.replace(/\//g, "-");

          //TODO change it to config env var.
          var frontendURL = 'http://actual.spaceshiplabs.com';

          var recoverURL =  frontendURL + '/change_password?';
          recoverURL += 'token='+token;
          recoverURL += '&email='+email;
          sendPasswordRecoveryEmail({recoverURL: recoverURL, email: email}, res, req);
        }
      });
    }else{
      return res.notFound();
    }
  },

  update_password: function(req, res){
    var form = req.params.all();
    var token = form.token || false;
    var email = form.email || false;
    var password = form.password || false;
    var confirmPass = form.confirm_pass || false;
    if(token && email && password && confirmPass){
      if(password == confirmPass){
        validateToken(token, email, function(err, result){
          User.update({email:email},{password: password}).exec(function(err, user){
            if(err || typeof user == 'undefined'){
              console.log(err);
              return res.ok({success:false});
            }else{
              return res.ok({success:true});
            }
          });
        });
      }else{
        return res.ok({success:false});
      }
    }else{
      return res.ok({success:false});
    }
  }


};

function sendPasswordRecoveryEmail(params, res, req){
  var data = {
    recoverURL: params.recoverURL,
  };
  var head = {
    to: params.email,
    subject: 'Solicitud de cambio de contraseña en Actual System'
  };

  sails.hooks.email.send(
    "passwordRecovery", data, head, function(err){
      if(err){
        console.log(err);
        return res.ok({success:false});
      }
      return res.ok({
        success:true,
        recoverURL: data.recoverURL//REMOVE IN PRODUCTION
      });
  });
}

function validateToken(token, email, cb){
  User.findOne( {email:email}, {select: ['id', 'email', 'password']} ).exec(function(err,user){
    if(err){
      console.log(err);
    }
    var values = user.id + user.email + user.password;
    var realToken = values;
    bcrypt.compare(realToken, token, cb);
  });
}


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
    var searchFields   = ['firstName','email'];
    var populateFields = ['role', 'SlpCode'];
    Common.find(model, form, searchFields, populateFields).then(function(result){
      res.ok(result);
    },function(err){
      res.notFound();
    });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    User.findOne({id: id})
      .populate('permissions')
      .populate('Stores')
      .populate('mainStore')
      .populate('role')
      .populate('SlpCode')
      .exec(function(err, result){
        if(err){
          console.log(err);
          res.notFound();
        }else{
          res.ok({data:result});
        }
      });
  },

  findBySlpCode: function(req, res){
    var form = req.params.all();
    var id = form.id;
    User
      .findOne({SlpCode:id})
      .populate('SlpCode')
      .exec(function(err, result){
        if(err){
          res.negotiate(err);
        }else{
          res.ok({data:result});
        }
      });
  },

  create: function(req, res){
    var form = req.allParams();
    User.create(form).exec(function(err, _user){
      console.log(err);
      if (err) {
        return res.negotiate(err);
      } else {
        return res.ok({user: _user});
      }
    });
  },

  update: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    delete form.password;
    //console.log(form);
    User.update({id: id}, form, function(err, user){
      if(err) {
        return res.negotiate(err);
      }
      return res.ok({
        user: user
      });
    });
  },

  send_password_recovery: function(req, res){
    var form  = req.params.all();
    var email = form.email || false;
    if(email && Common.validateEmail(email) ){
      User.findOne( {email:email}, {select: ['id', 'password', 'email']} ).exec(function(err,user){
        if(err || typeof user == 'undefined') {
          console.log(err);
          return res.notFound();
        } else {
          var values = user.id + user.email + user.password;
          var tokenAux = bcrypt.hashSync(values ,bcrypt.genSaltSync(10));
          var token = tokenAux;
          //var token = tokenAux.replace(/\//g, "-");

          //TODO change it to config env var.
          var frontendURL = 'http://admin.miactual.com';

          var recoverURL =  frontendURL + '/auth/reset-password?';
          recoverURL += 'token='+token;
          recoverURL += '&email='+email;
          Email.sendPasswordRecovery(
            user.firstName,
            user.email,
            recoverURL,
            function(err) {
              if (err){return res.negotiate(err)};
              return res.ok({
                success:true,
              });
            }
          );
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
          User.update(
            {email: email},
            {new_password: password}
          ).exec(function(err, user){
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
  },

  brokers: function(req, res) {
    var form  = req.params.all();
    var page  = form.page  || 1;
    var limit = form.limit || 10;
    Role
      .findOne({name: 'broker'})
      .populate('owner')
      .paginate({page: page, limit: limit})
      .exec(function(err, role){
        if (err) {return res.negotiate(err);}
        return res.json(role.owner);
      });
  },

  stores: function(req, res) {
    var form  = req.allParams();
    var email = form.email;
    User.findOne({email: email})
      .populate('Stores')
      .exec(function(err, user) {
        if (err) {return res.negotiate(err);}
        sails.log.info('user');
        sails.log.info(user);
        var stores = user && user.Stores || [];
        return res.json(stores);
      });

  }
};

function validateToken(token, email, cb){
  User.findOne(
    {email:email},
    {select: ['id', 'email', 'password']}
  ).exec(function(err,user){
    if(err){
      console.log(err);
    }
    var values = user.id + user.email + user.password;
    var realToken = values;
    bcrypt.compare(realToken, token, cb);
  });
}


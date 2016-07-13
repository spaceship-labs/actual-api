/**
 * MeController
 *
 * @description :: Server-side logic for managing us
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  update: function(req, res) {
    var form = req.params.all();
    var user = req.user;
    delete form.password;
    User.update({id: user.id}, form, function(err,user){
      if(err) {return res.negotiate(err)};
      return res.json(user[0]);
    });
  }
};


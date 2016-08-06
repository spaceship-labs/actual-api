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
    delete form.email;
    User.update({id: user.id}, form).exec(function updateCB(err,user){
      if(err) {return res.negotiate(err)};
      return res.json(user[0]);
    });
  },
  companyActive: function(req, res) {
    var user = req.user;
    User.findOne(user.id).populate('companyActive').exec(function(err, user){
      if (err) {return res.negotiate(err);}
      return res.json(user.companyActive);
    });
  }
};


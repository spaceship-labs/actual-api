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
  },
  generateCashReport: function(req, res){
    var form = req.params.all();
    var user = req.user;
    var startDate = form.startDate || new Date();
    var endDate = form.endDate || new Date();
    var q = {
      User: user.id,
      createdAt: { '>=': startDate, '<=': endDate }
    };
    Payment.find(q).populate('Order').populate('Store')
      .then(function(payments){
        res.json(payments);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }
};


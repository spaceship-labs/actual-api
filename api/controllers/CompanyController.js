/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Company.find()
      .then(function(companies){
        res.json(companies);
      })
      .catch(function(err){
        console.log('err',err);
        res.negotiate(err);
      });
  },

  getAll: function(req, res) {
    Company.find()
      .then(function(companies){
        res.json(companies);
      })
      .catch(function(err){
        console.log('err',err);
        res.negotiate(err);
      });
  },

  countSellersGeneral: function(req, res) {
    var form    = req.allParams();
    var company = form.company;
    Role
      .findOne({name: 'seller'})
      .then(function(role) {
        return User.count({
          role: role.id,
          companyMain: company,
          projectUser: false
        });
      })
      .then(function(sellers) {
        return res.json(sellers);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  countSellersProject: function(req, res) {
    var form    = req.allParams();
    var company = form.company;
    Role
      .findOne({name: 'seller'})
      .then(function(role) {
        return User.count({
          role: role.id,
          companyMain: company,
          projectUser: true
        });
      })
      .then(function(sellers) {
        return res.json(sellers);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }

};


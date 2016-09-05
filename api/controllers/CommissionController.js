/**
 * CommissionController
 *
 * @description :: Server-side logic for managing commissions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    var form = req.params.all();
    var model = 'commission';
    var searchFields   = ['user', 'rate', 'ammount'];
    var populateFields = ['payment'];
    Common.find(model, form, searchFields, populateFields).then(function(result){
      res.ok(result);
    },function(err){
      res.notFound();
    });
  },

  total: function(req, res) {
    var form  = req.allParams();
    var query = {
      user: form.user,
      datePayment: {
        '>=': form.dateFrom,
        '<': form.dateTo
      }
    };
    Commission
      .find(query)
      .then(function(commissions) {
        var commission = commissions.reduce(function(acum, current) {
          return acum + current.ammount;
        }, 0);
        var total = commissions.reduce(function(acum, current) {
          return acum + current.ammountPayment;
        }, 0);
        return [commission, total];
      })
      .spread(function(commissions, total) {
        return res.json({
          commissions: commissions,
          total: total
        });
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }
};


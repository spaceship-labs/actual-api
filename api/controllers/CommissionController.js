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
    var searchFields   = [];
    var populateFields = [];
    Common.find(model, form, searchFields, populateFields).then(function(result){
      res.ok(result);
    },function(err){
      res.notFound();
    });
  }
};


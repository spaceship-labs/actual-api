/**
 * GoalController
 *
 * @description :: Server-side logic for managing goals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('q');

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'goal';
    var searchFields   = ['name', 'role.name', 'ammount'];
    var selectFields   = form.fields;
    var populateFields = ['role'];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      return res.ok(result);
    },function(err){
      return res.notFound();
    });
  },

  create: function(req, res) {
    var form = req.params.all();
    var goal = form.goal;
    Goal.create(goal).exec(function(err, goal) {
      if (err) {return res.negotiate(err);}
      return res.json(goal);
    });
  }
};


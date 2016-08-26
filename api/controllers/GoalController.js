/**
 * GoalController
 *
 * @description :: Server-side logic for managing goals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    var form = req.allParams();
    var model = 'goal';
    var searchFields   = ['goal', 'sellers', 'date'];
    var populateFields = ['store'];
    Common.find(model, form, searchFields, populateFields).then(function(result){
      res.ok(result);
    },function(err){
      res.notFound();
    });
  },

  findById: function(req, res) {
    var form = req.allParams();
    var id   = form.id;
    Goal
      .findOne(id)
      .then(function(goal) {
        return res.json(goal);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  create: function(req, res) {
    var form = req.allParams();
    var goal = form.goal;
    Goal
      .create(goal)
      .then(function(goal) {
        return res.json(goal);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  update: function(req, res) {
    var form = req.allParams();
    var goal = form.goal;
    Goal
      .update(goal.id, goal)
      .then(function(goal) {
        return res.json(goal);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }
};


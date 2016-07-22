/**
 * GoalController
 *
 * @description :: Server-side logic for managing goals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('q');

module.exports = {
  find: function(req, res) {
    Promise
      .all([
        Goal.count(),
        Goal.find().populate('role')
      ])
      .spread(function(total, goals){
        return res.json({
          total: total,
          data: goals
        });
      })
      .catch(function(err){
        return res.negotiate(err);
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


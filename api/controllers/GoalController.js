/**
 * GoalController
 *
 * @description :: Server-side logic for managing goals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Goal.find().exec(function(err, goals) {
      if (err) {return res.negotiate(err);}
      return res.json(goals);
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


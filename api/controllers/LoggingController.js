/**
 * LoggingController
 *
 * @description :: Server-side logic for managing Loggings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create: function(req, res) {
    var form        = req.params.all();
    var message     = form.message;
    var action      = form.action;
    var references  = form.references || {};
    references.user = references.user || req.user;
    Logger.log(message, action, references).then(function(log) {
      return res.json(log);
    }).catch(function(err){
      return res.negotiate(err);
    });
  },

  find: function(req, res) {
    Logging.find().exec(function(err, log) {
      if (err) {return res.negotiate(err);}
      return res.json(log);
    });
  },
};


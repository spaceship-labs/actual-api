/**
 * LoggingController
 *
 * @description :: Server-side logic for managing Loggings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Logging.find().exec(function(err, log) {
      if (err) {return res.negotiate(err);}
      return res.json(log);
    });
  }
};


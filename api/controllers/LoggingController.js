module.exports = {
  create: function(req, res) {
    var form        = req.params.all();
    var user        = req.user || form.user;
    var message     = form.message;
    var action      = form.action;
    var references  = form.references || {};

    //@param {Object User} form.user
    //@param {string} form.message
    //@param {string} form.action
    //@param {Object} form.references
    Logger.log(user, message, action, references).then(function(log) {
      return res.json(log);
    }).catch(function(err){
      return res.negotiate(err);
    });
  },

  find: function(req, res) {
    var form         = req.params.all();
    var query        = {};
    var paginate     = {
      page:  form.page  || 1,
      limit: form.limit || 5
    };

    //@param {Object User o id/hexadecimal} form.user
    if (form.user) {
      query.user = form.user;
    }
    Logging.find(query)
      .sort('createdAt DESC')
      .paginate(paginate)
      .populate('user').exec(function(err, log) {
        if (err) {return res.negotiate(err);}
        return res.json(log);
      });
  },



};


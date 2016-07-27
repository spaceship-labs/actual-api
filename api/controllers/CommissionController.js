module.exports = {
  create: function(req, res) {
    var form       = req.allParams();
    var commission = form.commission;
    Commission.create(commission).exec(function(err, commission){
      if (err) {return res.negotiate(err);}
      return res.json(commission);
    });
  },

  find: function(req, res) {

  },

  search: function(req, res) {

  }
}

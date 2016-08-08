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
    Commission.find().exec(function(err, commissions) {
      if (err) {return res.negotiate(err);}
      return res.json(commissions);
    });
  },

  findById: function(req, res) {
    var id = req.param('id');
    Commission.findOne(id).exec(function(err, commission) {
      if (err) {return res.negotiate(err);}
      return res.json(commission);
    });
  },

  update: function(req, res) {
    var form = req.allParams();
    var id   = form.id;
    Commission.update(id, form).exec(function(err, commission) {
      if (err) {return res.negotiate(err);}
      return res.json(commission);
    });
  },


  search: function(req, res){
    var form = req.params.all();
    var model = 'commission';
    var searchFields   = ['name', 'type.name'];
    var selectFields   = form.fields;
    var populateFields = ['type'];
    Common.find(
      model,
      form,
      searchFields,
      populateFields,
      selectFields
    ).then(function(result){
      return res.ok(result);
    },function(err){
      return res.notFound();
    });
  },

}

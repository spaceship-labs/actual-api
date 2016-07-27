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

  findById: function(req, res) {

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

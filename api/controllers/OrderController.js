module.exports = {
  create: function(req, res){
    var form = req.params.all();
    Order.create(form).exec(function(err, created){
      if(err) console.log(err);
      res.json(created);
    });
  },

  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'order';
    var searchFields = [];
    var selectFields = form.fields;
    var populateFields = ['Client'];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  },

  createFromQuotation: function(req, res){
    var form = req.params.all();
    var quotationId = fomr.quotationId;
  }

}

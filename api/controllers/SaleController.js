module.exports = {

  findByClient: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'sale';
    var searchFields = [];
    var selectFields = form.fields;
    var populateFields = [];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });

  }

}

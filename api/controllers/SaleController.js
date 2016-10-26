module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'sale';
    var extraParams = {
      selectFields: form.fields
    };
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });

  }

}

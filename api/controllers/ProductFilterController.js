module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'productfilter';
    var searchFields = ['Name'];
    var populateFields = ['Categories'];
    Common.find(model, form, searchFields, populateFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  }
};

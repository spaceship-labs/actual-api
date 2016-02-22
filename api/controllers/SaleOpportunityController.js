module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'saleopportunity';
    var searchFields = ['CardCode'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  }
}

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'saleopportunity';
    var extraParams = {
      searchFields: ['CardCode','CardName']
    };
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  }
}

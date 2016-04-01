module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'productcategory';
    var searchFields = ['Name'];
    var populateFields = ['Filters'];
    Common.find(model, form, searchFields, populateFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  create: function(req, res){
    var form = req.params.all();
  }
};

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'product';
    var searchFields = ['ItemName','ItemCode'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },
  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Product.find({id:id}).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        if(results.length > 0){
          res.ok({data:results[0]});
        }else{
          res.notFound();
        }
      }
    });
  },
}

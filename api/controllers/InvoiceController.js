module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'invoice';
    var searchFields = ['Dscription','ItemCode','ShipToCode'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  }
}

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'invoice';
    var extraParams = {
      searchFields: ['Dscription','ItemCode','ShipToCode']
    };
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  }
};

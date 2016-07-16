module.exports = {
  create: function(req,res){
    var form = req.params.all();
    Promotion.create(form)
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  find: function(req, res){
    var form = req.params.all();
    var model = 'promotion';
    var searchFields = ['name','code'];
    var selectFields = form.fields;
    var populateFields = [];
    Common.find(model, form, searchFields, populateFields, selectFields)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

}

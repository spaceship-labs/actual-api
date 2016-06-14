module.exports = {
  create: function(req, res){
    var form = req.params.all();
    ProductSize.create(form).exec(function createdCB(err, created){
      if(err) console.log(err);
      console.log(created);
      res.json(created);
    });
  },
  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductSize.update({id:id},form).exec(function updatedCB(err, updated){
      if(err) console.log(err);
      console.log(updated);
      res.json(updated);
    });
  },
  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductSize.destroy({id:id}).exec(function destroyedCB(err){
      if(err) console.log(err);
      res.json({destroyed:true});
    });

  }
};

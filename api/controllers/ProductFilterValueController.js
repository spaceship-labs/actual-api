module.exports = {
  create: function(req, res){
    var form = req.params.all();
    ProductFilterValue.create(form).exec(function createdCB(err, created){
      if(err) throw(err);
      console.log(created);
      res.json(created);
    });
  },
  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductFilterValue.update({id:id},form).exec(function updatedCB(err, updated){
      if(err) throw(err);
      console.log(updated);
      res.json(updated);
    });
  },
  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductFilterValue.destroy({id:id}).exec(function destroyedCB(err){
      if(err) throw(err);
      res.json({destroyed:true});
    });

  }
};

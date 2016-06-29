module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'custombrand';
    var searchFields = ['Name'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },
  getAll: function(req, res){
    CustomBrand.find({}).limit(1000).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        return res.ok(results);
      }
    })
  },
  create: function(req, res){
    var form = req.params.all();
    CustomBrand.create(form).exec( function cb(err, created){
      if(err) console.log(err);
      res.json(created);
    });
  },
  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    CustomBrand.destroy({id:id}).exec(function(err){
      if(err) console.log(err);
      return res.json({destroyed: true});
    });
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    CustomBrand.update({id:id},form).exec(function updateDone(err, updatedBrand){
      if(err){
        console.log(err);
      }
      res.json(updatedBrand);
    });

  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    CustomBrand.findOne({id:id}).exec(function(err, brand){
      if(err) console.log(err);
      res.json(brand);
    });
  },


}

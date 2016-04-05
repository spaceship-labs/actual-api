module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'productcategory';
    var searchFields = ['Name'];
    var populateFields = ['Childs'];

    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },


  getAllCategories: function(req, res){
    ProductCategory.find().populate('Childs').populate('Parents').then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  getMainCategories: function(res, res){
    ProductCategory.find({IsMain:true}).then(function(categories){
      res.json(categories);
    },function(err){
      console.log(err);
      res.notFound();
    });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductCategory.findOne({id:id}).populate('Childs').populate('Parents').exec(function(err, category){
      if(err) throw(err);
      res.json(category);
    });
  },

  create: function(req, res){
    var form = req.params.all();

    var parents = form.parents;

    ProductCategory.create(form).exec(function(err1, result){
      if(err1) throw(err1);

      if(result){

        ProductCategory.findOne({id:result.id}).populate('Parents').exec(function(err2, category){
          if(err2) throw(err);

          for(parent in parents){
            category.Parents.add(parent);
          }
          console.log(category.Parents);

          category.save(function(err3, categoryResult){
            if(err3) throw(err3);
            console.log('final result');
            console.log(categoryResult);
            res.json(categoryResult);
          });

        });
      }
      else{
        res.json(false);
      }

    });
  }
};

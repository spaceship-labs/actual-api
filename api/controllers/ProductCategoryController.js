var async = require('async');

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
    ProductCategory.find().sort('CategoryLevel ASC').populate('Childs').populate('Parents').then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  getCategoriesGroups: function(req, res){
    var categoriesGroups = [];
    ProductCategory.find({CategoryLevel:1}).populate('Childs').exec(function(err,mainCategories){
      if(err) throw(err);

      categoriesGroups.push(mainCategories);

      ProductCategory.find({CategoryLevel:2}).populate('Childs').exec(function(err2,subcategories){
        if(err2) throw(err2);
        categoriesGroups.push(subcategories);

        ProductCategory.find({CategoryLevel:3}).populate('Parents').exec(function(err3, subsubcategories){
          if(err3) throw(err3);
          categoriesGroups.push(subsubcategories);
          res.json(categoriesGroups);
        });

      });
    });
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

  //TODO: Check why .add() doesnt work for ProductCategory.Parents
  create: function(req, res){
    var form = req.params.all();
    var parents = form.Parents;
    var relationRecords = [];
    ProductCategory.create(form).exec(function(err1, result){
      if(err1) throw(err1);
      if(result){
        res.json(result);
      }
      else{
        res.json(false);
      }
    });
  },

  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductCategory.destroy({id:id}).exec(function(err){
      if(err) throw(err);
      return res.json({destroyed: true});
    });
  },

  //TODO: Check better way to add/remove ProductCategory.Parent relation
  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductCategory.update({id:id},form).exec(function updateDone(err, updatedCategory){
      if(err) throw(err);
      res.json(updatedCategory);
    });

  },


};

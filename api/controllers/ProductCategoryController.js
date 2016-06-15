var async = require('async');
var _ = require('underscore');

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

  getCategoriesTree: function(req, res){
    var getLevel1 = function(callback){
      ProductCategory.find({CategoryLevel:1}).populate('Childs').exec(function(err,categorieslv1){
        if(err){
          console.log(err);
        }
        callback(null,categorieslv1)
      });
    };
    var getLevel2 = function(level1, callback){
      ProductCategory.find({CategoryLevel:2}).populate('Childs').populate('Parents').exec(function(err,categorieslv2){
        if(err){
          console.log(err);
        }
        callback(null, level1 ,categorieslv2);
      });
    };

    var getLevel3 = function(level1, level2, callback){
      ProductCategory.find({CategoryLevel:3}).populate('Parents').exec(function(err,level3){
        if(err){
          console.log(err);
        }
        callback(null, [level1, level2, level3]);
      });
    };

    async.waterfall([getLevel1, getLevel2, getLevel3], function(err, groups){
      var categoriesLv1 = groups[0] || [];
      var categoriesLv2 = groups[1] || [];
      var categoriesLv3 = groups[2] || [];
      var categoryTree = [];

      categoriesLv1.forEach(function(clv1){
        var mainCategory = _.clone(clv1);
        mainCategory =  mainCategory.toObject();
        mainCategory.Childs = [];

        clv1.Childs.forEach(function(child){
          var lvl2 = _.findWhere( categoriesLv2, {id: child.id });
          if(lvl2){
            lvl2 = lvl2.toObject();
            mainCategory.Childs.push(lvl2);
          }
        });

        if(mainCategory.Childs.length <= 0){
          clv1.Childs.forEach(function(child){
            var lvl3 = _.findWhere( categoriesLv3, {id: child.id });
            if(lvl3){
              lvl3 = lvl3.toObject();
              mainCategory.Childs.push(lvl3);
            }
          });
        }

        categoryTree.push(mainCategory);
      });
      res.json({categoryTree:categoryTree, groups: groups});

    });


  },

  getCategoriesGroups: function(req, res){
    var categoriesGroups = [];
    ProductCategory.find({CategoryLevel:1}).populate('Childs').exec(function(err,mainCategories){
      if(err){
        console.log(err);
        res.json(false);
      }else{
        categoriesGroups.push(mainCategories);

        ProductCategory.find({CategoryLevel:2}).populate('Childs').exec(function(err2,subcategories){
          if(err2){
            console.log(err2);
            res.json(false);
          }else{

            categoriesGroups.push(subcategories);

            ProductCategory.find({CategoryLevel:3}).populate('Parents').exec(function(err3, subsubcategories){
              if(err3){
                console.log(err3);
                res.json(false);
              }else{
                categoriesGroups.push(subsubcategories);
                res.json(categoriesGroups);
              }
            });
          }

        });
      }
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
      if(err) console.log(err);
      res.json(category);
    });
  },

  //TODO: Check why .add() doesnt work for ProductCategory.Parents
  create: function(req, res){
    var form = req.params.all();
    var parents = form.Parents;
    var relationRecords = [];
    ProductCategory.create(form).exec(function(err1, result){
      if(err1) console.log(err1);
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
      if(err) console.log(err);
      return res.json({destroyed: true});
    });
  },

  //TODO: Check better way to add/remove ProductCategory.Parent relation
  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductCategory.update({id:id},form).exec(function updateDone(err, updatedCategory){
      if(err){
        console.log(err);
      }
      res.json(updatedCategory);
    });

  },


};

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

  create: function(req, res){
    var form = req.params.all();

    var parents = form.parents;
    var relationRecords = [];

    ProductCategory.create(form).exec(function(err1, result){
      if(err1) throw(err1);
      if(result){

        for(index in parents){
          relationRecords.push({
            Child: result.id,
            Parent: parents[index]
          });
        }

        ProductCategoryTree.create(relationRecords).exec(function createCB(err3, created){
          if(err3) throw(err3);
          res.json(result);
        });

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
      var query = {or: [{Child:id},{Parent:id}]}
      ProductCategoryTree.destroy(query).exec(function(err){
        return res.json({destroyed: true});
      });
    });
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    //Array of new parents id's
    var editParents = _.clone(form.Parents);
    var toRemoveParents = [];
    var toAddParents = [];

    //delete form.Parents;
    delete form.Childs;

    ProductCategory.update({id:id},form).exec(function updateDone(err, updatedCategory){
      if(err) throw(err);

      ProductCategory.findOne({id:id}).populate('Parents').exec(function(err2, category){
        if(err2) throw(err2);

        console.log(category);

        //If a category was not a parent category, add it as a parent
        if(category.Parents.length > 0){
          editParents.forEach(function(editParent){
            if( _.where(category.Parents, {id : editParent}).length <= 0 ){
              console.log('agregando editParent : ' + editParent);
              toAddParents.push({Parent:editParent, Child: id});
              //category.Parents.add(editParent);
            }
          });
        }else{
          console.log('no hay parents');
          editParents.forEach(function(editParent){
            console.log('agregando parent : ' + editParent);
            toAddParents.push({Parent:editParent, Child: id});
            //category.Parents.add(editParent);
          });
        }

        //If the parent(from DB) is not in the new category parents(editParents), assume
        //that the parent doesn't exist, remove it.
        category.Parents.forEach(function(dbParent){
          if( _.where(editParents, {id : dbParent.id}).length <= 0 ){
            console.log('removiendo editParent : ' + dbParent.id);
            toRemoveParents.push(dbParent.id);
            //category.Parents.remove(dbParent.id);
          }
        });

        if(toRemoveParents.length > 0){
          ProductCategoryTree.destroy({id:toRemoveParents}).exec(function(errDestroy){
            if(errDestroy) throw(errDestroy);
            ProductCategoryTree.create(toAddParents).exec(function(errCreate, relations){
              if(errCreate) throw(errCreate);
              res.json(category);
            });
          });
        }
        else{
          ProductCategoryTree.create(toAddParents).exec(function(errCreate, relations){
            if(errCreate) throw(errCreate);
            res.json(category);
          });
        }


      });

    });

  },


};

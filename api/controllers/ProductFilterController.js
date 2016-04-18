var _ = require('underscore');
var async = require('async');

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'productfilter';
    var searchFields = ['Name'];
    //var populateFields = ['Categories'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  list: function(req, res){
    ProductFilter.find().populate('Values').exec(function(err, filters){
      if(err) throw(err);
      res.json(filters);
    });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductFilter.findOne({id:id}).populate('Values').populate('Categories').exec(function(err, filter){
      if(err){
        console.log(err);
        throw(err);
      }
      res.json(filter);
    });
  },

  //TODO: check why .add() doesnt work on categories.
  create: function(req, res){
    var form = req.params.all();
    var filterValues = _.clone(form.Values);
    var filterCategories = _.clone(form.Categories);
    var categoriesToAdd = [];
    var valuesToAdd = [];
    //delete form.Values;
    //delete form.Categories;

    //Creating filter
    ProductFilter.create(form).exec(function(err, created){
      console.log('created');
      console.log(created);
      if(err){
        console.log(err);
        throw(err);
      }

      filterValues.forEach(function(value){
        value.Filter = created.id;
        console.log(value);
        valuesToAdd.push(value);
      });

      filterCategories.forEach(function(category){
        categoriesToAdd.push({category: category, filter: created.id});
      });

      function createValues(callback){
        if(valuesToAdd.length > 0){
          ProductFilterValue.create(valuesToAdd).exec(function createCB(err4, created){
            if(err4){
              console.log(err4);
              throw(err4);
            }
            callback();
          });
        }else{
          callback();
        }
      }

      function relateCategories(callback){
        if(categoriesToAdd.length > 0){
          ProductCategory_ProductFilter.create(categoriesToAdd).exec(function(err4, finalResult){
            if(err4) throw(err4);
            callback();
          });
        }else{
          callback();
        }
      }

      function finalResult(err, results){
        res.json(created);
      }

      async.waterfall([createValues, relateCategories], finalResult);

    });
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var editValues = _.clone(form.Values);
    var editCategories = _.clone(form.Categories);

    var categoriesToAdd = [];
    var categoriesToRemove = [];
    var categoriesRelationsIds= [];
    var valuesToRemove = [];
    var valuesToAdd = [];

    delete form.Values;
    delete form.Categories;

    ProductFilter.update({id:id},form).exec(function updateDone(err, updatedFilter){
      ProductFilter.findOne({id:id}).populate('Values').populate('Categories').exec(function searchDone(err, filter){
        if(err) throw(err);
        if(filter){

          /*---------/
            CREATING AND REMOVING FILTER CATEGORIES
          /*--------*/

          //If the category is not in the filter, add the category.
          if(filter.Categories.length > 0){
            editCategories.forEach(function(category){
              if( _.where(filter.Categories, {id : category.id}).length <= 0 ){
                console.log('agregando category : ' + category.id);
                //filter.Categories.add(category.id);
                categoriesToAdd.push({
                  category: category.id,
                  filter: filter.id
                });
              }
            });
          }else{
            editCategories.forEach(function(category){
              //filter.Categories.add(category.id);
              categoriesToAdd.push({
                category: category.id,
                filter: filter.id
              });
            });
          }

          //If the category(from DB) is not in the filter categories(editCategories), assume
          //that the category doesn't exist, remove it.
          filter.Categories.forEach(function(dbCategory){
            if( _.where(editCategories, {id : dbCategory.id}).length <= 0 ){
              //filter.Categories.remove(dbCategory.id);
              categoriesToRemove.push({
                category: dbCategory.id,
                filter: filter.id
              });
            }
          });

          function addCategories(callback){
            if(categoriesToAdd.length > 0){
              ProductCategory_ProductFilter.create(categoriesToAdd).exec(function(err4, addedCategories){
                if(err4) throw(err4);
                callback();
              });
            }else{
              callback();
            }
          }

          function getCategoriesRelation(callback){
            if(categoriesToRemove.length > 0){
              ProductCategory_ProductFilter.find(categoriesToRemove).exec(function(err5, relations){
                relations.forEach(function(relation){
                  categoriesRelationsIds.push(relation.id);
                });
                callback();
              });
            }else{
              callback();
            }
          }

          function removeCategories(callback){
            if(categoriesRelationsIds.length > 0){
              ProductCategory_ProductFilter.destroy({id: categoriesRelationsIds}).then(function(resultdestroy){
                callback();
              }).catch(function(err6){
                if(err6){
                  console.log(err6);
                  throw(err6);
                }
                callback();
              });
            }else{
              callback();
            }
          }

          function finalResult(err, results){
            res.json({destroyed: true});
          }

          async.waterfall([
            addCategories,
            getCategoriesRelation,
            removeCategories
            ], finalResult
          );
        }
      });
    })

  },

  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var values = form.Values;
    var categories = form.Categories;

    ProductFilter.destroy({id:id}).exec(function(err){
      if(err) throw(err);

      function deleteValues(callback){
        //Deleting filter values
        if(values){
          ProductFilterValue.destroy({Filter:id}).exec(function(err2){
            if(err2) throw(err2);
            callback();
          });
        }else{
          callback();
        }
      }

      function destroyCategoriesRelation(callback){
        if(categories){
          //Deleting relations with categories
          ProductCategory_ProductFilter.destroy({filter:id}).exec(function(err3){
            if(err3) throw(err3);
            callback();
          });
        }else{
          callback();
        }
      }


      function finalResult(err, results){
        res.json({destroyed:true});
      }

      async.waterfall([deleteValues, destroyCategoriesRelation], finalResult);

    });
  }
};

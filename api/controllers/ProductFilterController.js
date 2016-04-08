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

  create: function(req, res){
    var form = req.params.all();
    var filterValues = _.clone(form.Values);
    var filterCategories = _.clone(form.Categories);
    var categoriesToAdd = [];
    delete form.Values;
    delete form.Categories;
    //Creating filter
    ProductFilter.create(form).exec(function(err, filter){
      console.log(filter);
      if(err){
        console.log(err);
        throw(err);
      }

      //Adding values to filter
      ProductFilter.findOne({id:filter.id}).populate('Values').exec(function(err2, filterR){
        if(err2) throw(err2);

        filterValues.forEach(function(value){
          filterR.Values.add({Name: value});
        });

        filterCategories.forEach(function(category){
          console.log('agregando categoria a filtro : '  + category);
          //filterR.Categories.add({});
          categoriesToAdd.push({
            category: category,
            filter: filterR.id
          });
        });

        filterR.save(function(err3, saveResult){
          if(err3) throw(err3);

          ProductCategory_ProductFilter.create(categoriesToAdd).exec(function(err4, finalResult){
            if(err4) throw(err4);
            res.json(finalResult);
          });

        });
      });


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

    delete form.Values;
    delete form.Categories;

    var valuesToRemove = [];
    ProductFilter.update({id:id},form).exec(function updateDone(err, updatedFilter){
      ProductFilter.findOne({id:id}).populate('Values').populate('Categories').exec(function searchDone(err, filter){
        if(err) throw(err);
        if(filter){

          /*---------/
            CREATING AND REMOVING FILTER VALUES
          /*--------*/

          //If the value is not in the filter, create the value.
          editValues.forEach(function(val){
            if( _.where(filter.Values, {Name : val.Name}).length <= 0 ){
              filter.Values.add(val);
            }
          });

          //If the value(from DB) is not in the filter values(editValues), assume
          //that the value doesn't exist, delete it.
          filter.Values.forEach(function(dbValue){
            if( _.where(editValues, {Name : dbValue.Name}).length <= 0 ){
              valuesToRemove.push(dbValue.id);
              //filter.Values.remove(dbValue.id);
            }
          });

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


          filter.save(function(err2, saveRes){
            if(err2) throw(err2);

            async.waterfall([
              function removingValues(callback){
                if(valuesToRemove.length > 0){
                  ProductFilterValue.destroy({id: valuesToRemove}).exec(function(err3){
                    if(err3) throw(err3);
                    callback();
                  })
                }else{
                  callback();
                }
              },
              function addingCategories(callback){
                if(categoriesToAdd.length > 0){
                  ProductCategory_ProductFilter.create(categoriesToAdd).exec(function(err4, addedCategories){
                    if(err4) throw(err4);
                    callback();
                  });
                }else{
                  callback();
                }
              },
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
              },
              function removingCategories(callback){
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
            ], function finalResult(err, results){
              res.json({destroyed: true});
            });

          });
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

      //Waterfall start
      async.waterfall([

        function deletingValues(callback){
          //Deleting filter values
          if(values){
            ProductFilterValue.destroy({Filter:id}).exec(function(err2){
              if(err2) throw(err2);
              callback();
            });
          }else{
            callback();
          }
        },

        function destroyingCategoriesRelation(callback){
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

      ], function finalResult(err, results){
        res.json({destroyed:true});
      });
      //Waterfall end

    });
  }
};

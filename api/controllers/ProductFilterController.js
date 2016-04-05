var _ = require('underscore');

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
      if(err) throw(err);
      res.json(filter);
    });
  },

  create: function(req, res){
    var form = req.params.all();
    var filterValues = _.clone(form.Values);
    delete form.Values;
    var filterValuesFormatted = [];
    var relationRecords = [];
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
        for(index in filterValues){
          var value = {
            Name:filterValues[index]
          };
          filterR.Values.add(value);
        }
        filterR.save(function(err3, finalResult){
          if(err3) throw(err3);
          res.json(finalResult);
        });
      });


    });
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var editValues = _.clone(form.Values);
    var editCategories = _.clone(form.Categories);

    delete form.Values;
    delete form.Categories;

    var valuesToRemove = [];
    ProductFilter.update({id:id},form).exec(function updateDone(err, updatedFilter){
      ProductFilter.findOne({id:id}).populate('Values').populate('Categories').exec(function searchDone(err, filter){
        if(err) throw(err);
        if(filter){

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
          editCategories.forEach(function(category){
            if( _.where(filter.Categories, {id : category}).length <= 0 ){
              filter.Categories.add(category);
            }
          });

          //If the category(from DB) is not in the filter categories(editCategories), assume
          //that the category doesn't exist, remove it.
          filter.Categories.forEach(function(dbCategory){
            if( _.where(editValues, {id : dbCategory.id}).length <= 0 ){
              filter.Categories.remove(dbCategory.id);
            }
          });


          filter.save(function(err2, saveRes){
            if(err2) throw(err2);
            if(valuesToRemove.length > 0){
              ProductFilterValue.destroy({id: valuesToRemove}).exec(function(err3){
                if(err3) throw(err3);
                res.json(saveRes);
              })
            }else{
              res.json(saveRes);
            }
          })
        }
      });
    })

  },

  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var values = form.Values;

    ProductFilter.destroy({id:id}).exec(function(err){
      if(err) throw(err);
      if(values){
        //Deleting filter values
        ProductFilterValue.destroy({Filter:id}).exec(function(err2){
          if(err2) throw(err2);
          //Deleting relations with categories
          ProductCategory_ProductFilter.destroy({filter:id}).exec(function(err3){
            if(err3) throw(err3);
            res.json({destroyed:true});
          });
        })
      }
    })
  }
};

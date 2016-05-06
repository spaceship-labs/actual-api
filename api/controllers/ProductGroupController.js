var _ = require('underscore');

module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'productgroup';
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
    ProductGroup.findOne({id:id}).populate('Products').exec(function(err, group){
      if(err){
        console.log(err);
        throw(err);
      }
      res.json(group);
    });
  },

  create: function(req, res){
    var form = req.params.all();
    var productsToAdd = [];
    var products = _.clone(form.Products);
    delete form.Products;
    ProductGroup.create(form).exec(function(err, created){
      if(err){
        console.log('hay un error');
        console.log(err);
        throw(err);
      }
      else{
        if(products){
          products.forEach(function(prod){
            productsToAdd.push({
              product: prod.ItemCode,
              group: created.id
            });
          });
          console.log(productsToAdd);
          Product_ProductGroup.create(productsToAdd).exec(function relationsCB(err2, result){
            if(err2) console.log(err2);
            res.json(created);
          });

        }else{
          res.json(created);
        }
      }
    });
  },

  update: function(req,res){
    var form = req.params.all();
    ProductGroup.update({id: form.id}, form).exec(function updateCB(err, updated){
      if(err) console.log(err);
      res.json(updated);
    });
  },

  destroy: function(req, res){
    var form = req.params.all();
    ProductGroup.destroy({id: form.id}).exec(function destroyCB(err){
      if(err) console.log(err);

      Product_ProductGroup.destroy({group: form.id}).exec(function destroyRelationsCB(err2){
        if(err2) console.log(err);
        res.json({destroyed: true});
      });

    });
  },

  addProductToGroup: function(req, res){
    var form = req.params.all();
    Product_ProductGroup.create(form).exec(function createdCB(err, created){
      if(err) throw(err);
      console.log(created);
      res.json(created);
    });
  },
  removeProductFromGroup: function(req, res){
    var form = req.params.all();
    var product = form.product;
    var group = form.group;
    Product_ProductGroup.destroy({group:group, product:product}).exec(function destroyedCB(err){
      if(err) throw(err);
      res.json({destroyed:true});
    });

  },

  search: function(req, res){
    var form = req.params.all();
    var items = form.items || 10;
    var page = form.page || 1;
    var term = form.term || false;
    var query = {};
    var querySearchAux = {};
    var model = ProductGroup;
    var searchFields = ['Name'];

    if(term){
      if(searchFields.length > 0){
        query.or = [];
        for(var i=0;i<searchFields.length;i++){
          var field = searchFields[i];
          var obj = {};
          obj[field] = {contains:term};
          query.or.push(obj);
        }
      }
      querySearchAux = _.clone(query);
    }

    query.skip = (page-1) * items;
    query.limit = items;

    var read = model.find(query);

    read.exec(function(err, results){
      model.count(querySearchAux).exec(function(err,count){
        if(err){
          console.log(err);
          return res.notFound();
        }else{
          return res.ok({data:results, total:count});
        }
      })
    });

  },

  updateIcon: function(req,res){
    var form = req.params.all();
    ProductGroup.updateAvatar(req,{
      dir : 'groups',
      profile: 'avatar',
      id : form.id,
    },function(e,group){
      if(e) console.log(e);
      //TODO check how to retrieve images instead of doing other query
      var selectedFields = ['icon_filename','icon_name','icon_size','icon_type','icon_typebase'];
      ProductGroup.findOne({id:form.id}, {select: selectedFields}).exec(function(err2, updatedGroup){
        if(err2) console.log(err2);
        return res.json(updatedGroup);
      });
      //res.json(product);
    });
  },

  removeIcon: function(req,res){
    var form = req.params.all();
    ProductGroup.destroyAvatar(req,{
      dir : 'groups',
      profile: 'avatar',
      id : form.id,
    },function(e,group){
      if(e) console.log(e);
      res.json(group);
    });
  },

  getGroupVariants: function(req, res){
    //['color','forma','tamano-camas-y-blancos-cama', 'firmeza']
    var fixedFilters = [
      {id:16, key:'color', handle:'color', name: 'Color'},
      {id:17, key:'forma', handle:'forma', name: 'Forma'},
      {id:5, key:'tamano', handle:'tamano-camas-y-blancos-cama', name: 'Tamaño'},
      {id:9, key:'firmeza', handle: 'firmeza', name: 'Firmeza'}
    ];
    var form = req.params.all();
    var variants = {};
    fixedFilters.forEach(function(filter){
      variants[filter.key] = {filterValues:[]};
    });

    //Getting all groups in product
    ProductGroup.findOne({id: form.id}).populate('Products').exec(function(err, group){

      if(err) console.log(err);
      var productsIds = [];
      group.Products.forEach(function(prod){
        productsIds.push(prod.ItemCode);
      });

      //Getting filterValues/variants from products from the group
      Product.find({ItemCode: productsIds}).populate('FilterValues').exec(function(err2, products){
        if(err2) console.log(err2);
        products.forEach(function(product){
          product.FilterValues.forEach(function(value){
            var onFilter = _.findWhere( fixedFilters, {id: value.Filter});
            if(onFilter){
              variants[onFilter.key].handle = onFilter.handle;
              variants[onFilter.key].name = onFilter.name;
              variants[onFilter.key].filterValues.push({
                filterId: value.Filter,
                filterHandle: onFilter.handle,
                name: onFilter.Name,
                product: product.ItemCode,
                value: value,
              });
            }
          });
        });
        res.json(variants);
      });
    });
  },



};

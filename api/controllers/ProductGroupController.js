var _ = require('underscore');

module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'productgroup';
    var searchFields = ['Name'];
    Common.find(model, form, searchFields)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductGroup.findOne({id:id})
      .populate('Products')
      .then(function(group){
        res.json(group);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  getVariantGroupProducts: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductGroup.findOne({id:id, Type:'variations'}).populate('Products')
      .then(function(group){
        if(group.Products.length > 0){
          var productsIds = [];
          group.Products.forEach(function(prod){
            productsIds.push(prod.ItemCode);
          });
          return Product.find({ItemCode: productsIds}).populate('FilterValues')
        }else{
          return false;
        }
      })
      .then(function(products){
        if(products){
          return res.json(products);
        }
        return res.json(false);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  create: function(req, res){
    var form = req.params.all();
    ProductGroup.create(form)
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  update: function(req,res){
    var form = req.params.all();
    delete form.Products;
    ProductGroup.update({id: form.id}, form)
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  destroy: function(req, res){
    var form = req.params.all();
    ProductGroup.destroy({id: form.id})
      .then(function(){
        res.json({destroyed:true});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  addProductToGroup: function(req, res){
    var form = req.params.all();
    var product = form.product;
    var group = form.group;
    ProductGroup.findOne({id: group}).populate('Products')
      .then(function(group){
        if(group){
          group.Products.add(product);
          group.save(function(errSave, result){
            if(errSave){
              console.log(errSave);
              return Promise.reject(errSave);
            }
            sails.log.debug('product added to group');
            return res.json(result);
          });
        }
        return res.json(group)
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  removeProductFromGroup: function(req, res){
    var form = req.params.all();
    var product = form.product;
    var group = form.group;
    ProductGroup.findOne({id: group}).populate('Products')
      .then(function(group){
        group.Products.remove(product);
        group.save(function(errSave, result){
          if(errSave){
            console.log(errSave);
            return Promise.reject(errSave);
          }
          res.json(result);
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })

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
    var groups = false;
    var groupsCount = false;
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
    
    ProductGroup.find(query)
      .then(function(results){
        groups = results;
        return model.count(querySearchAux)
      })
      .then(function(count){
        return res.ok({data:groups, total:count});
      })
      .catch(function(err){
        console.log(err);
        return res.negotiate(err);
      })
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
      var selectedFields = [
        'icon_filename',
        'icon_name',
        'icon_size',
        'icon_type',
        'icon_typebase'
      ];
      ProductGroup.findOne({id:form.id}, {select: selectedFields})
        .then(function(updatedGroup){
          res.json(updatedGroup);
        })
        .catch(function(err){
          res.negotiate(err);
        })
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
      if(e) {
        console.log(e);
        return res.negotiate(e);
      }
      res.json(group);
    });
  },

  findPackages: function(req, res){
    var form = req.params.all();
    var model = 'productgroup';
    var searchFields = ['Name'];
    form.filters = form.filters || {};
    form.filters.Type = 'packages';
    //var populateFields = ['Categories'];
    Common.find(model, form, searchFields)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

};

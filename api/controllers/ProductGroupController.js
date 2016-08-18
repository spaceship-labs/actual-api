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
    ProductGroup.findOne({id:id, Type:'variations'}).populate('Products').exec(function(err, group){
      if(err){
        console.log(err);
      }
      if(group.Products.length > 0){
        var productsIds = [];
        group.Products.forEach(function(prod){
          productsIds.push(prod.ItemCode);
        });
        Product.find({ItemCode: productsIds}).populate('FilterValues').exec(function(err2, prods){
          if(err2) console.log(err2);
          res.json(prods);
        });

      }else{
        res.json(false);
      }
    });
  },

  create: function(req, res){
    var form = req.params.all();
    sails.log.debug(form);
    ProductGroup.create(form).exec(function(err, created){
      if(err){
        console.log(err);
      }
      res.json(created);
    });
  },

  update: function(req,res){
    var form = req.params.all();
    delete form.Products;
    ProductGroup.update({id: form.id}, form).exec(function updateCB(err, updated){
      if(err) console.log(err);
      res.json(updated);
    });
  },

  destroy: function(req, res){
    var form = req.params.all();
    ProductGroup.destroy({id: form.id}).exec(function destroyCB(err){
      if(err) console.log(err);

      res.json({destroyed: true});

    });
  },

  addProductToGroup: function(req, res){
    var form = req.params.all();
    var product = form.product;
    var group = form.group;
    ProductGroup.findOne({id: group}).populate('Products').exec(function(err, prod){
      if(err){
        console.log(err);
      }
      if(product){
        prod.Products.add(product);
        prod.save(function(errSave, result){
          if(errSave){
            console.log(errSave);
          }
          sails.log.debug('product added to group');
          res.json(result);
        });
      }else{
        res.json(prod);
      }
    });
  },
  removeProductFromGroup: function(req, res){
    var form = req.params.all();
    var product = form.product;
    var group = form.group;
    ProductGroup.findOne({id: group}).populate('Products').exec(function(err, prod){
      if(err){
        console.log(err);
      }
      prod.Products.remove(product);
      prod.save(function(errSave, result){
        if(errSave){
          console.log(errSave);
        }
        res.json(result);
      });
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

  findPackages: function(req, res){
    var form = req.params.all();
    var model = 'productgroup';
    var searchFields = ['Name'];
    form.filters = form.filters || {};
    form.filters.Type = 'packages';
    //var populateFields = ['Categories'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

};

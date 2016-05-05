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

}

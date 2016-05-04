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
    ProductGroup.create(form).exec(function(err, created){
      if(err) console.log(err);
      /*
      console.log(created);
      if(form.Products){
        form.Products.forEach(function(prod){
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
      */
        res.json(created);
      //}
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

  }



}

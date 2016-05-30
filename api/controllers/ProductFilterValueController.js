var _ = require('underscore');

module.exports = {
  create: function(req, res){
    var form = req.params.all();
    ProductFilterValue.create(form).exec(function createdCB(err, created){
      if(err) throw(err);
      //console.log(created);
      res.json(created);
    });
  },
  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductFilterValue.update({id:id},form).exec(function updatedCB(err, updated){
      if(err) throw(err);
      //console.log(updated);
      res.json(updated);
    });
  },
  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductFilterValue.destroy({id:id}).exec(function destroyedCB(err){
      if(err) throw(err);
      res.json({destroyed:true});
    });

  },

  getProducts: function(req, res){
    var form = req.params.all();
    var valuesIds = form.ids;
    ProductFilterValue.find({id: valuesIds}).populate('Products').exec(function findCB(err, values){
      if(err){
        console.log(err);
      }
      var prods = [];
      values.forEach(function(val){
        prods = prods.concat(val.Products);
      });
      //prods = _.uniq(prods);
      var prodsIds = [];
      prods.forEach(function(prod){
        prodsIds.push(prod.ItemCode);
      });

      Product.find({ItemCode: prodsIds}).populate('files').populate('FilterValues').exec(function findCB(errProds, products){
        if(errProds){
          console.log(errProds);
        }

        /*
        valuesIds.forEach(function(val){
          products
        });
        */
        var filteredProducts = [];

        products.forEach(function(prod){
          var hasAllValues = true;
          valuesIds.forEach(function(valId){
            var exists = _.findWhere(prod.FilterValues, {id: valId});
            if(!exists){
              hasAllValues = false;
            }
          });
          if(hasAllValues){
            filteredProducts.push(prod);
          }
        });

        res.json(filteredProducts);
      });

    });
  }
};

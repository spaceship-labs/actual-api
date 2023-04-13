var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
  findPackages: function(req, res){
    var form = req.allParams();
    var model = 'productgroup';
    var extraParams = {
      searchFields: ['Name']
    };
    form.filters = form.filters || {};
    form.filters.Type = 'packages';
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  },

  getProducts: function(req, res){
    var form = req.allParams();
    var id = form.id;
    ProductGroup.findOne({id: id, Type:'packages'}).populate('Products')
      .then(function(group){
        var products = group.Products;
        var productsIds = products.map(function(p){return p.id;});
        var q = {PromotionPackage: id, limit:1};
        return Product.find({id:productsIds}).populate('PackageRules',q);
      })
      .then(function(finalProducts){
        finalProducts = finalProducts.map(function(p){
          if(p.PackageRules.length > 0){
            p.packageRule = _.clone(p.PackageRules[0]);
          }
          delete p.PackageRules;
          return p;
        });
        res.json(finalProducts);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  update: function(req, res){
    var form = req.allParams();
    var id = form.id;
    var packageRules = form.packageRules || [];
    var updatedPackage = false;

    ProductGroup.update({id:id, Type:'packages'}, form)
      .then(function(updated){
        updatedPackage = updated;
        return Promise.each(packageRules, updatePackageRule);
      })
      .then(function(){
        return removeUnusedPackageRules(id);
      })
      .then(function(){
        res.json(updatedPackage);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  getDetailedPackage: function(req, res){
    var form = req.allParams();
    var id = form.id;
    ProductGroup.findOne({id:id,Type:'packages'})
      .populate('Stores')
      .populate('PackageRules')
      .then(function(pack){
        return res.json(pack);
      })
      .catch(function(err){
        console.log(err);
        return res.negotiate(err);
      });
  }

};

function updatePackageRule(packageObj){
  var q = {
    Product         : packageObj.productId,
    PromotionPackage: packageObj.packageId
  };
  return PackageRule.findOne(q)
    .then(function(productPackage){
      var params = {
        quantity: packageObj.packageRule.quantity,
        discountPg1: packageObj.packageRule.discountPg1,
        discountPg2: packageObj.packageRule.discountPg2,
        discountPg3: packageObj.packageRule.discountPg3,
        discountPg4: packageObj.packageRule.discountPg4,
        discountPg5: packageObj.packageRule.discountPg5,
        discountType: packageObj.packageRule.discountType,
        Product: packageObj.productId,
        PromotionPackage: packageObj.packageId
      };
      if(!productPackage){
        return PackageRule.create(params);
      }else{
        return PackageRule.update({id:productPackage.id}, params);
      }
    })
    .then(function(createdOrUpdated){
      return createdOrUpdated;
    })
    .catch(function(err){
      console.log(err);
      return err;
    });
}


function removeUnusedPackageRules(packageId){
  return ProductGroup.findOne({id:packageId,Type:'packages'})
    .populate('Products')
    .populate('PackageRules')
    .then(function(productGroup){

      var products = productGroup.Products || [];
      var unusedRulesIds = (productGroup.PackageRules|| []).reduce(function(arr, rule){

        var ruleHasProduct = _.findWhere(products,{id:rule.Product});
        if(!ruleHasProduct){
          arr.push(rule.id);
        }
        return arr;
      },[]);

      return PackageRule.destroy({id:unusedRulesIds});
    });
}
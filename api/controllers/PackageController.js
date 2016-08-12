var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
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

  getProducts: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductGroup.findOne({id: id, Type:'packages'}).populate('Products')
      .then(function(group){
        var products = group.Products;
        var productsIds = products.map(function(p){return p.id});
        var q = {Package: id, limit:1};
        return Product.find({id:productsIds}).populate('PackagesInfo',q);
      })
      .then(function(finalProducts){
        finalProducts = finalProducts.map(function(p){
          if(p.PackagesInfo.length > 0){
            p.packageInfo = _.clone(p.PackagesInfo[0]);
          }
          delete p.PackagesInfo;
          return p;
        });
        res.json(finalProducts);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  updatePackageProducts: function(req, res){
    var form = req.params.all();
    var productsInfo = form.productsInfo || [];
    Promise.each(productsInfo, updateProductInfo)
      .then(function(){
        res.json(true);
      })
      .catch(function(err){
        res.negotiate(err);
      })
  }

}

function updateProductInfo(product){
  var q = {
    Product: product.productId,
    Package: product.packageId
  };
  return ProductPackageInfo.findOne(q)
    .then(function(productPackage){
      var params = {
        quantity: product.packageInfo.quantity,
        discount: product.packageInfo.discount,
        discountType: product.packageInfo.discountType,
        Product: product.productId,
        Package: product.packageId
      };
      if(!productPackage){
        return ProductPackageInfo.create(params);
      }else{
        return ProductPackageInfo.update({id:productPackage.id}, params);
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

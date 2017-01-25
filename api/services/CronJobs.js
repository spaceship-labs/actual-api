var cron = require('cron').CronJob;
var Promise = require('bluebird');
var storesCodes = [];

module.exports.init = function(){
  console.log('initing cronJobs');
  var cronJobs = [
    {
      fn: function(d){
        getPromos();
      },
      time:'0 0 */4 * * *'
      //time: '0 */4 * * * *'
      //s,m,h,d del mes,m,d de la semana
    },
    {
      fn: function(d){
        cacheCategoriesProducts();
      },
      time:'0 0 */1 * * *'
    },
    {
      fn: function(d){
        ProductService.cacheProductDiscountPrices();
      },
      time:'0 */30 * * * *'
    }

  ].forEach(function(v){
    
    if(process.env.NODE_ENV === 'production'){
      new cron(v.time,v.fn, true, true);
    }
  
  });
};

function cacheCategoriesProducts(){
  var price = {
    '>=': 0,
    '<=': Infinity
  };
  var productsQuery = {
    Price: price,
    Active: 'Y'
  };
  sails.log.info('cache categories stock start : ' + new Date());
  return getAllStoresCodes().then(function(codes){
      storesCodes = codes;
      return ProductCategory.find({select:['Name']}).populate('Products', productsQuery);
    })
    .then(function(categories){
      return Promise.each(categories, updateCategory);
    })
    .then(function(){
      sails.log.info('cache categories stock end: ' + new Date());
      return true;
    })
    .catch(function(err){
      console.log(err);
      return err;
    })
}

function updateCategory(category){
  var categoryStock = getProductsStoresStock(category.Products);
  return ProductCategory.update({id:category.id}, categoryStock);
}

function getProductsStoresStock(products){
  var stock = {};
  stock = products.reduce(function(stockAux, product){
    for(var i = 0;i < storesCodes.length;i++){
      stockAux[storesCodes[i]] = stockAux[storesCodes[i]] || 0;
      if(product[storesCodes[i]]){
        stockAux[storesCodes[i]]++;
      }
    }
    return stockAux;
  },{});
  stock.productsNum = products.length;
  return stock;
}


function getAllStoresCodes(){
  return Store.find({select:['code']})
    .then(function(stores){
      var storesCodes = stores.map(function(s){
        return s.code;
      });    
      return storesCodes;
    });
}

function getPromos(){
  //Excluding expired promotions
  var query = {
    endDate: {'>=': new Date()}
  };
  Promotion.find(query)
    .populate('FilterValues')
    .populate('Categories')
    .populate('Groups')
    .populate('CustomBrands')
    .then(function(promos){
      if(promos){
        Promise.each(promos,updatePromo).then(function(){
          sails.log.info('Termino update de todas las promos');
        });
      }else{
        console.log('No habia promos por actualizar');
        return null;
      }
    });
}


function updatePromo(promo){
  var categories = promo.Categories.map(function(c){return c.id});
  var filtervalues = promo.FilterValues.map(function(fv){return fv.id});
  var groups = promo.Groups.map(function(g){return g.id});
  var excluded = [];
  if(promo.excludedProducts && promo.excludedProducts.length > 0){
    excluded = promo.excludedProducts.map(function(p){return p.id});
  }
  var opts = {
    name: promo.name,
    OnStudio: promo.OnStudio || false,
    OnHome: promo.OnHome || false,
    OnKids: promo.OnKids || false,
    OnAmueble: promo.OnAmueble || false,
    U_Empresa: promo.U_Empresa || false,
    itemCode: promo.itemCode || false,
    categories: categories,
    filtervalues: filtervalues,
    groups: groups,
    excluded: excluded,
  };
  sails.log.info('Searching:');
  return Search.promotionCronJobSearch(opts).then(function(res){
    if(res && _.isArray(res)){
      var products = res.map(function(p){return p.id});
      sails.log.info('Actualizando (' +opts.name+ ') con ' + products.length + ' products' );
      sails.log.info('U_Empresa : ' + opts.U_Empresa);
      return Promotion.update({id: promo.id}, {Products: products})
        .then(function(updated){
          return null;
        })
        .catch(function(err){
          console.log(err);
          return null;
        });
    }else{
      return null;
    }
    //return res;
  }).catch(function(err){
    console.log(err);
    //return err;
  });
}

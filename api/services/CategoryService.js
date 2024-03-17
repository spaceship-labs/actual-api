var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
	cacheCategoriesProducts,
  buildCategoriesTree,
  isAWebStoreCode,
  getAllStoresCodes
};


async function cacheCategoriesProducts(){
  var price = {
    '>=': 0,
    '<=': Infinity
  };
  var productsQuery = {
    Price: price,
    Active: 'Y'
  };
  //sails.log.info('cache categories stock start: ' + new Date());
  const storesCodes = await getAllStoresCodes();
  const categories = await ProductCategory.find({select:['Name']}).populate('Products', productsQuery);
  console.log("START cacheCategoriesProducts")

  const result = await Promise.each(categories, function(category){
    return updateCategory(category, storesCodes);
  });
  console.log("END cacheCategoriesProducts")
  return true;
}

function updateCategory(category, storesCodes){
  console.log("category ", category)
  var categoryStock = getProductsStoresStock(category.Products, storesCodes);
  console.log("categoryStock ",categoryStock)
  return ProductCategory.update({id:category.id}, categoryStock);
}

function getProductsStoresStock(products, storesCodes){
  var stock = {};
  stock = products.reduce(function(stockAux, product){
    for(var i = 0;i < storesCodes.length;i++){
      stockAux[storesCodes[i]] = stockAux[storesCodes[i]] || 0;
      
      if( isAWebStoreCode(storesCodes[i]) ){
        if(product[storesCodes[i]] > 0 && !product.excludeWeb && product.U_FAMILIA === 'SI'){
          stockAux[storesCodes[i]]++;
        }
      }else{
        if(product[storesCodes[i]] > 0){
          stockAux[storesCodes[i]]++;
        }
      }
    }
    return stockAux;
  },{});

  //Assigning 0 stock as default, when no value is provided
  for(var i=0;i<storesCodes.length; i++){
    stock[storesCodes[i]] = stock[storesCodes[i]] || 0;
  }

  stock.productsNum = products.length;
  return stock;
}

function isAWebStoreCode(storeCode){
  var webStoreCodes = [
    'actual_home',
    'actual_kids',
    'actual_studio'
  ];
  return webStoreCodes.indexOf(storeCode) > -1;
}


async function getAllStoresCodes(){
  const stores = await Store.find({select:['code']});
  const storesCodes = stores.map(function(s){
    return s.code;
  });    
  console.log(storesCodes)
  return _.uniq(storesCodes);
}

function buildCategoriesTree(categoriesLv1, categoriesLv2, categoriesLv3){
  var categoryTree = [];
  categoriesLv1.forEach(function(clv1){
    var mainCategory = _.clone(clv1);
    mainCategory =  mainCategory.toObject();
    mainCategory.Childs = [];

    clv1.Childs.forEach(function(child){
      var lvl2 = _.findWhere( categoriesLv2, {id: child.id });
      if(lvl2){
        lvl2 = lvl2.toObject();
        mainCategory.Childs.push(lvl2);
      }
    });

    if(mainCategory.Childs.length <= 0){
      clv1.Childs.forEach(function(grandChild){
        var lvl3 = _.findWhere( categoriesLv3, {id: grandChild.id });
        if(lvl3){
          lvl3 = lvl3.toObject();
          mainCategory.Childs.push(lvl3);
        }
      });
    }

    categoryTree.push(mainCategory);
  });
  return categoryTree;  
}
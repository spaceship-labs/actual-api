var assign   = require('object-assign');
var _        = require('underscore');

module.exports = {
  applyFilters: applyFilters,
  applyOrFilters: applyOrFilters,
  getProductsByCategories: getProductsByCategories,
  getProductsByCategory: getProductsByCategory,
  getProductsByFilterValue: getProductsByFilterValue,
  getProductsByGroup: getProductsByGroup,
  hashToArray: hashToArray,
  promotionCronJobSearch: promotionCronJobSearch,
  queryIdsProducts: queryIdsProducts,
  queryPrice: queryPrice,
  queryTerms: queryTerms,
};

function queryIdsProducts(query, idProducts) {
  return assign(query, {
    id: idProducts
  });
}

function queryPrice(query, minPrice, maxPrice) {
  var price = {
    '>=': minPrice || 0,
    '<=': maxPrice || Infinity
  };
  return assign(query, {
    Price: price
  });
}

function applyFilters(query, filters) {
  filters.forEach(function(filter) {
    if (filter.value && !_.isUndefined(filter.value) && _.isArray(filter.value) && filter.value.length > 0) {
      query[filter.key] = filter.value;
    } else if (filter.value && !_.isUndefined(filter.value) && !_.isArray(filter.value)) {
      query[filter.key] = filter.value;
    }
  });
  return query;
}

function applyOrFilters(query, filters){
  if(filters.length > 0){
    var and = [];
    filters.forEach(function(filter){
      filter.values = filter.values.filter(function(v){
        return v;
      });
      if(filter.values.length > 0){
        var or = [];
        filter.values.forEach(function(val){
          var cond = {};
          cond[filter.key] = val;
          or.push(cond);
        });
        if(or.length > 0){
          and.push({$or: or});
        }
      }
    });
    if(and.length > 0){
      query.$and = and;
    }
  }
  return query;
}

function queryTerms(query, terms) {
  if (!terms || terms.length == 0) {
    return query;
  }
  var searchFields = [
    'Name',
    'ItemName',
    'ItemCode',
    'Description',
    'DetailedColor'
  ];
  var filter = searchFields.reduce(function(acum, sf){
    
    var and = terms.reduce(function(acum, term){
      var fname = {};
      fname[sf] = {contains: term};
      return acum.concat(fname);
    }, []);

    return acum.concat({$and: and});

  }, []);

  return assign(query, {$or: filter});
}

function getProductsByCategory(categoryQuery) {
  return ProductCategory.find(categoryQuery)
    .then(function(category) {
      category = category.map(function(cat){return cat.id;});
      return Product_ProductCategory.find({productCategory: category});
    })
    .then(function(relations) {
      return relations.map(function(relation){
        return relation.product;
      });
    });
}

function getProductsByCategories(categoriesIds, options) {
  var productsIds         = [];
  var excludedProductsIds = []; //Flag variable
  options = options || {};
  return Product_ProductCategory.find({productCategory: categoriesIds})
    .then(function(relations) {
      relations = relations.reduce(function(prodMap, current){
        prodMap[current.product] = (prodMap[current.product] || []).concat(current.productCategory);
        return prodMap;
      }, {});
      relations = hashToArray(relations);
      //TODO revisar esto, no funciona
      if(options.excludedCategories){
        relations = relations.filter(function(relation){
          var productId         = relation[0];
          var productCategories = relation[1];
          var intersection = _.intersection(productCategories, options.excludedCategories);
          return intersection.length == 0;
        });
      }

      if(options.applyIntersection){
        //If product has all the searching categories        
        relations = relations.filter(function(relation) {
          var productCategories = relation[1];
          return _.isEqual(categoriesIds, productCategories);
        });
      }
      productsIds = relations.map(function(relation) {
        return relation[0]; //Product ID
      });

      return productsIds;
    });
}

function getProductsByFilterValue(filtervalues){
  return Product_ProductFilterValue.find({productfiltervalue: filtervalues})
    .then(function(relations) {
      relations = relations.reduce(function(prodMap, current){
        prodMap[current.product] = (prodMap[current.product] || []).concat(current.productfiltervalue);
        return prodMap;
      }, {});
      relations = hashToArray(relations);
       //Check if product has all the filter values
      relations = relations.filter(function(relation) {
        var productFilterValues = relation[1];
        return _.isEqual(filtervalues, productFilterValues);
      });
      return relations.map(function(relation) {
        return relation[0]; //Product ID
      });
    });
}

function getProductsByGroup(groups) {
  return ProductGroup.find({id:groups})
    .then(function(group) {
      group = group.map(function(grp){return grp.id;});
      return Product_ProductGroup.find({productgroup: group});
    })
    .then(function(relations) {
      return relations.map(function(relation){
        return relation.product;
      });
    });
}


function hashToArray(hash) {
  var entries = Object.keys(hash);
  return entries.map(function(entry){
    return [entry, hash[entry]]
  });
}

function intersection(set1, set2) {
  return set1.filter(function(si) {
    return set2.indexOf(si) != -1;
  });
}

//TODO change for underscore intersection number
function getMultiIntersection(arrays){
  arrays = arrays.filter(function(arr){return arr.length > 0});
  var finalIntersection = [];
  if(arrays.length > 0){
    finalIntersection = arrays.shift().reduce(function(intersection, value) {
        var valueIsInArrays = arrays.every(function(arr) {
          return arr.indexOf(value) !== -1;
        });
        if (intersection.indexOf(value) === -1 && valueIsInArrays){
          intersection.push(value);
        }
        return intersection;
    }, []);
  }
  return finalIntersection;
}

//Advanced search for marketing cron job
function promotionCronJobSearch(opts) {
  var categories          = [].concat(opts.categories);
  var filtervalues        = [].concat(opts.filtervalues);
  var groups              = [].concat(opts.groups);
  var sas                 = [].concat(opts.sas);
  var excluded            = opts.excluded || [];
  var excludedCategories  = opts.excludedCategories || [];
  var price             = {
    '>=': opts.minPrice || 0,
    '<=': opts.maxPrice || Infinity
  };
  var filters = [
    {key:'Price', value: price},
    {key:'Active', value: 'Y'},
    {key:'OnStudio', value: opts.OnStudio},
    {key:'OnHome', value: opts.OnHome},
    {key:'OnKids', value: opts.OnKids},
    {key:'OnAmueble', value: opts.OnAmueble},
    {key:'ItemCode', value: opts.itemCode}
  ];
  var orFilters = [
    {key: 'CustomBrand', values: [].concat(opts.customBrands)},
    {key: 'U_Empresa', values: sas},
  ];

  return getProductsByCategories(
    categories, 
    {excludedCategories: form.excludedCategories}
  )
    .then(function(catprods) {
      return [
        catprods,
        getProductsByFilterValue(filtervalues),
        getProductsByGroup(groups)
      ];
    })
    .spread(function(catprods, filterprods, groupsprods) {
      return _.intersection.apply(null, [catprods, filterprods, groupsprods]);
    })
    .then(function(idProducts) {
      if( (categories.length > 0 || filtervalues.length > 0 || groups.length > 0) && idProducts.length > 0){
        if(excluded.length > 0){
          var ids = _.difference(idProducts, excluded);
          filters.push({
            key:'id',
            value:ids
          });
        }else{
          filters.push({key:'id', value: idProducts});
        }
      }else if((categories.length > 0 || filtervalues.length > 0 || groups.length > 0) && idProducts.length == 0){
        return [];
      }

      if(excluded.length > 0 && idProducts.length == 0){
        filters.push({
          key:'id',
          value:{'!':excluded}
        });
      }

      var query = applyFilters({},filters)
      query     = applyOrFilters(query , applyOrFilters);
      var products = Product.find(query);
      return products;
    })
    .then(function(products) {
      return products;
    })
    .catch(function(err) {
      console.log(err);
      return err;
    });
}

module.exports = {
  applyFilters: applyFilters,
  getMultiIntersection: getMultiIntersection,
  getProductsByCategories: getProductsByCategories,
  getProductsByCategory: getProductsByCategory,
  getProductsByFilterValue: getProductsByFilterValue,
  getProductsByGroup: getProductsByGroup,
  hashToArray: hashToArray,
  intersection: intersection,
  promotionCronJobSearch: promotionCronJobSearch,
  queryIdsProducts: queryIdsProducts,
  queryPrice: queryPrice,
  queryTerms: queryTerms,
};

function queryIdsProducts(query, idProducts) {
  return assign(query, {id: idProducts});
}

function queryPrice(query, minPrice, maxPrice) {
  var price = {
    '>=': minPrice || 0,
    '<=': maxPrice || Infinity
  };
  return assign(query, {Price: price});
}

function applyFilters(query, filters){
  filters.forEach(function(filter){
    if(filter.value && !_.isUndefined(filter.value) && _.isArray(filter.value) && filter.value.length > 0 ){
      query[filter.key] = filter.value;
    }
    else if(filter.value && !_.isUndefined(filter.value) && !_.isArray(filter.value)  ){
      query[filter.key] = filter.value;
    }
  });
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
  var filter       = searchFields.reduce(function(acum, sf){
    var and = terms.reduce(function(acum, term){
      var fname = {};
      fname[sf] = {contains: term};
      return acum.concat(fname);
    }, []);
    return acum.concat({$and: and})
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

function getProductsByCategories(categoriesIds) {
  return Product_ProductCategory.find({productCategory: categoriesIds})
    .then(function(relations) {
      relations = relations.reduce(function(prodMap, current){
        prodMap[current.product] = (prodMap[current.product] || []).concat(current.productCategory);
        return prodMap;
      }, {});
      relations = hashToArray(relations);
      relations = relations.filter(function(relation) {
        return _.isEqual(categoriesIds, relation[1]);
      });
      return relations.map(function(relation) {
        return relation[0];
      });
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
      relations = relations.filter(function(relation) {
        return _.isEqual(filtervalues, relation[1]);
      });
      return relations.map(function(relation) {
        return relation[0];
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
  var categories   = [].concat(opts.categories);
  var filtervalues = [].concat(opts.filtervalues);
  var groups       = [].concat(opts.groups);
  var noIcons      = opts.noIcons || false;
  var price        = {
    '>=': opts.minPrice || 0,
    '<=': opts.maxPrice || Infinity
  };
  var paginate = {
    page:  opts.page  || 1,
    limit: opts.limit || 99999999999
  };
  var filters = [
    {key:'Price', value: price},
    {key:'Active', value: 'Y'},
    {key:'CustomBrand', value: opts.customBrands },
    {key:'OnStudio', value: opts.OnStudio},
    {key:'OnHome', value: opts.OnHome},
    {key:'OnKids', value: opts.OnKids},
    {key:'OnAmueble', value: opts.OnAmueble},
  ];

  return getProductsByCategories(categories)
    .then(function(catprods) {
      return [catprods, getProductsByFilterValue(filtervalues), getProductsByGroup(groups)];
    })
    .spread(function(catprods, filterprods, groupsprods) {
      return getMultiIntersection([catprods, filterprods, groupsprods]);
    })
    .then(function(idProducts) {
      if( (categories.length > 0 || filtervalues.length > 0 || groups.length > 0) && idProducts.length > 0){
        filters.push({key:'id', value: idProducts});
      }else if((categories.length > 0 || filtervalues.length > 0 || groups.length > 0) && idProducts.length == 0){
        return [Promise.resolve(0),Promise.resolve(0)];
      }

      var q = applyFilters({},filters);
      var find = Product.find(q)
        .paginate(paginate)
        .sort('Available DESC')

      return [Product.count(q), find];
    })
    .spread(function(total, products) {
      //console.log('Total: ' + products);
      return products;
      /*return res.json({
        products: products,
        total: total
      });
      */
    })
    .catch(function(err) {
      console.log(err);
      return err;
      //return res.negotiate(err);
    });
}

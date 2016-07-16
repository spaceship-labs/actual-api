var util     = require('util');
var ObjectId = require('mongodb').ObjectID;
var assign   = require('object-assign');

module.exports = {
  searchByFilters: function(req, res){
    var form         = req.params.all();
    var terms        = [].concat(form.keywords || []);
    var filtervalues = [].concat(form.ids || []);
    var minPrice     = form.minPrice;
    var maxPrice     = form.maxPrice;
    var paginate     = {
      page:  form.page  || 1,
      limit: form.items || 10
    };
    var query        = {};
    query            = queryTerms(query, terms);
    query            = queryPrice(query, minPrice, maxPrice);
    query.Active     = 'Y';
    getProductsByFilterValue(filtervalues)
      .then(function(idProducts) {
        if (filtervalues.length != 0) {
          query = queryIdsProducts(query, idProducts);
        }
        return [Product.count(query), Product.find(query).paginate(paginate)];
      })
      .spread(function(total, products) {
        return res.json({total: total, products: products});
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  searchByCategory: function(req, res) {
    var form         = req.params.all();
    var handle       = [].concat(form.category);
    var filtervalues = [].concat(form.filtervalues);
    var price        = {
      '>=': form.minPrice || 0,
      '<=': form.maxPrice || Infinity
    };
    var paginate     = {
      page:  form.page  || 1,
      limit: form.limit || 10
    };

    getProductsByCategories({Handle:handle})
      .then(function(catprods) {
        return [catprods, getProductsByFilterValue(filtervalues)];
      })
      .spread(function(catprods, filterprods) {
        if (!handle || handle.length == 0) {
          return filterprods;
        } else if(!filtervalues || filtervalues.length == 0) {
          return catprods;
        } else {
          return intersection(catprods, filterprods);
        }
      })
      .then(function(idProducts) {
        var q = {
          id: idProducts,
          Price: price,
          Active: 'Y'
        };
        return [
          Product.count(q),
          Product.find(q)
            .paginate(paginate)
            .sort('Available DESC')
            .populate('files')
        ];
      })
      .spread(function(total, products) {
        return res.json({
          products: products,
          total: total
        });
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  advancedSearch: function(req, res) {
    var form         = req.params.all();
    var categories   = [].concat(form.categories);
    var filtervalues = [].concat(form.filtervalues);
    var groups       = [].concat(form.groups);
    var price        = {
      '>=': form.minPrice || 0,
      '<=': form.maxPrice || Infinity
    };
    var paginate     = {
      page:  form.page  || 1,
      limit: form.limit || 10
    };

    var filters = [
      {key:'Price', value: price},
      {key:'Active', value: 'Y'},
      {key:'CustomBrand', value: form.CustomBrand},
      {key:'OnStudio', value: form.OnStudio},
      {key:'OnHome', value: form.OnHome},
      {key:'OnKids', value: form.OnKids},
      {key:'OnAmueble', value: form.OnAmueble},
    ];


    getProductsByCategories({id:categories})
      .then(function(catprods) {
        return [catprods, getProductsByFilterValue(filtervalues), getProductsByGroup(groups)];
      })
      .spread(function(catprods, filterprods, groupsprods) {
        return getMultiIntersection([catprods, filterprods, groupsprods]);
      })
      .then(function(idProducts) {
        if( (categories && categories.length > 0) || (filtervalues && filtervalues.length > 0) || (groups && groups.length > 0) ){
          filters.id = idProducts;
        }
        var q = applyFilters({},filters);
        return [
          Product.count(q),
          Product.find(q)
            .paginate(paginate)
            .sort('Available DESC')
            .populate('files')
        ];
      })
      .spread(function(total, products) {
        return res.json({
          products: products,
          total: total
        });
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }

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
    if(filter.value && !_.isUndefined(filter.value) ){
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

function getProductsByCategories(categoryQuery) {
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

  /*
  advancedSearch: function(req, res){
    var form         = req.params.all();
    var terms        = [].concat(form.keywords || []);
    var minPrice     = form.minPrice;
    var maxPrice     = form.maxPrice;
    var paginate     = {
      page:  form.page  || 1,
      limit: form.items || 10
    };
    var query        = {};
    query            = queryTerms(query, terms);
    query            = queryPrice(query, minPrice, maxPrice);
    query.Active     = 'Y';
    Product.count(query)
      .then(function(total) {
        return [total, Product.find(query).paginate(paginate)];
      })
      .spread(function(total, products) {
        return res.json({total: total, data: products});
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },*/

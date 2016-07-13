var util     = require('util');
var ObjectId = require('mongodb').ObjectID;
var assign   = require('object-assign');

module.exports = {
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
  },

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

    getProductsByCategory(handle)
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

function getProductsByCategory(handle) {
  return ProductCategory.find({Handle: handle})
    .then(function(category) {
      category = category.map(function(cat){return cat.id;});
      return Product_ProductCategory.find({productcategory_Products: category});
    })
    .then(function(relations) {
      return relations.map(function(relation){
        return relation.product_Categories;
      });
    });
}

function getProductsByFilterValue(filtervalues){
  return Product_ProductFilterValue.find({productfiltervalue_Products: filtervalues})
    .then(function(relations) {
      relations = relations.reduce(function(prodMap, current){
        prodMap[current.product_FilterValues] = (prodMap[current.product_FilterValues] || []).concat(current.productfiltervalue_Products);
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

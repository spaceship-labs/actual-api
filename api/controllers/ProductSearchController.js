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
    query            = Search.queryTerms(query, terms);
    query            = Search.queryPrice(query, minPrice, maxPrice);
    query.Active     = 'Y';
    Search.getProductsByFilterValue(filtervalues)
      .then(function(idProducts) {
        if (filtervalues.length != 0) {
          query = Search.queryIdsProducts(query, idProducts);
        }

        var currentDate = new Date();
        var queryPromo = {
          select: ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'],
          startDate: {'<=': currentDate},
          endDate: {'>=': currentDate},
        };

        return [
          Product.count(query),
          Product.find(query)
            .populate('Promotions', queryPromo)
            .paginate(paginate)
        ];
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

    Search.getProductsByCategory({Handle:handle})
      .then(function(catprods) {
        return [catprods, Search.getProductsByFilterValue(filtervalues)];
      })
      .spread(function(catprods, filterprods) {
        if (!handle || handle.length == 0) {
          return filterprods;
        } else if(!filtervalues || filtervalues.length == 0) {
          return catprods;
        } else {
          return Search.intersection(catprods, filterprods);
        }
      })
      .then(function(idProducts) {
        var q = {
          id: idProducts,
          Price: price,
          Active: 'Y'
        };
        var currentDate = new Date();
        var queryPromo = {
          select: ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'],
          startDate: {'<=': currentDate},
          endDate: {'>=': currentDate},
        };
        return [
          Product.count(q),
          Product.find(q)
            .paginate(paginate)
            .sort('Available DESC')
            .populate('files')
            .populate('Promotions',queryPromo)
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
    var noIcons      = form.noIcons || false;
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
      {key:'CustomBrand', value: form.customBrands },
      {key:'OnStudio', value: form.OnStudio},
      {key:'OnHome', value: form.OnHome},
      {key:'OnKids', value: form.OnKids},
      {key:'OnAmueble', value: form.OnAmueble},
    ];


    Search.getProductsByCategories(categories)
      .then(function(catprods) {
        return [catprods, Search.getProductsByFilterValue(filtervalues), Search.getProductsByGroup(groups)];
      })
      .spread(function(catprods, filterprods, groupsprods) {
        return Search.getMultiIntersection([catprods, filterprods, groupsprods]);
      })
      .then(function(idProducts) {
        if( (categories.length > 0 || filtervalues.length > 0 || groups.length > 0) && idProducts.length > 0){
          filters.push({key:'id', value: idProducts});
        }else if((categories.length > 0 || filtervalues.length > 0 || groups.length > 0) && idProducts.length == 0){
          return [Promise.resolve(0),Promise.resolve(0)];
        }

        var q = Search.applyFilters({},filters);
        var currentDate = new Date();
        var queryPromo = {
          select: ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'],
          startDate: {'<=': currentDate},
          endDate: {'>=': currentDate},
        };
        var find = Product.find(q)
          .populate('Promotions',queryPromo)
          .paginate(paginate)
          .sort('Available DESC')

        if(!noIcons){
          find.populate('files')
        }
        return [Product.count(q), find];
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
    query            = Search.queryTerms(query, terms);
    query            = Search.queryPrice(query, minPrice, maxPrice);
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

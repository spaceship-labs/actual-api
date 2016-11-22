var _  = require('underscore');

module.exports = {
  searchByFilters: function(req, res){
    var form           = req.params.all();
    var terms          = [].concat(form.keywords || []);
    var filtervalues   = [].concat(form.ids || []);
    var minPrice       = form.minPrice;
    var maxPrice       = form.maxPrice;
    var queryPromos    = Search.getPromotionsQuery();
    var activeStoreId  = req.user.activeStore || false;
    var populateImgs   = !_.isUndefined(form.populateImgs) ? form.populateImgs : true;    
    var filterByStore  = !_.isUndefined(form.filterByStore) ? form.filterByStore : true;    
    var warehouses     = [];
    var productsIds    = [];
    var paginate     = {
      page:  form.page  || 1,
      limit: form.items || 10
    };
    var query        = {};
    query            = Search.queryTerms(query, terms);
    query            = Search.queryPrice(query, minPrice, maxPrice);
    query.Active     = 'Y';
    
    Search.getProductsByFilterValue(filtervalues)

      .then(function(productsIdsResult) {
        productsIds = productsIdsResult;
        if(filterByStore && activeStoreId){
          return Store.findOne({id:activeStoreId});
        }
        return false;
      })  
      .then(function(activeStore) {
        if (filtervalues.length > 0) {
          query = Search.queryIdsProducts(query, productsIds);
        }
        if(filterByStore && activeStore.code){
          query[activeStore.code] = {'>':0};
        }          
        var find = Product.find(query).populate('Promotions', queryPromos);
        if(populateImgs){
          find = find.populate('files');
        }
        return [
          Product.count(query),
          find.paginate(paginate)
            .sort('Price ASC')
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
    var form           = req.params.all();
    var handle         = [].concat(form.category);
    var filtervalues   = [].concat(form.filtervalues);
    var queryPromos    = Search.getPromotionsQuery();
    var activeStoreId  = req.user.activeStore || false;
    var filterByStore  = !_.isUndefined(form.filterByStore) ? form.filterByStore : true;    
    var query          = {};
    var productsIds    = [];
    var price          = {
      '>=': form.minPrice || 0,
      '<=': form.maxPrice || Infinity
    };
    var paginate       = {
      page:  form.page  || 1,
      limit: form.limit || 10
    };
    var productsIdsAux = [];

    Search.getProductsByCategory({Handle:handle})
      .then(function(catprods) {
        return [
          catprods, 
          Search.getProductsByFilterValue(filtervalues)
        ];
      })
      .spread(function(catprods, filterprods) {
        if (!handle || handle.length == 0) {
          return filterprods;
        } else if(!filtervalues || filtervalues.length == 0) {
          return catprods;
        } else {
          return _.intersection(catprods, filterprods);
        }
      })
      .then(function(productsIdsResult) {
        productsIds = productsIdsResult;
        if(filterByStore && activeStoreId){
          return Store.findOne({id:activeStoreId});
        }
        return false;
      })      
      .then(function(activeStore) {
        query = {
          id: productsIds,
          Price: price,
          Active: 'Y'
        };
        if(filterByStore && activeStore.code){
          query[activeStore.code] = {'>':0};
        }        
        return [
          Product.count(query),
          Product.find(query)
            .paginate(paginate)
            .sort('Price ASC')
            .populate('files')
            .populate('Promotions',queryPromos)
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
    var form               = req.params.all();
    var categories         = [].concat(form.categories);
    var filtervalues       = [].concat(form.filtervalues);
    var groups             = [].concat(form.groups);
    var sas                = [].concat(form.sas);
    var populateImgs       = !_.isUndefined(form.populateImgs) ? form.populateImgs : true;
    var populatePromotions = !_.isUndefined(form.populatePromotions) ? form.populatePromotions : true;
    var queryPromos        = Search.getPromotionsQuery();
    var activeStoreId      = req.user.activeStore || false;
    var filterByStore      = !_.isUndefined(form.filterByStore) ? form.filterByStore : true;
    var query              = {};
    var products           = [];
    var productsIds        = [];
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
      {key:'OnStudio', value: form.OnStudio},
      {key:'OnHome', value: form.OnHome},
      {key:'OnKids', value: form.OnKids},
      {key:'OnAmueble', value: form.OnAmueble},
      {key:'ItemCode', value: form.itemCode}
    ];
    var orFilters = [
      {key: 'CustomBrand', values: [].concat(form.customBrands)},
      {key: 'U_Empresa', values: sas},
    ];

    Search.getProductsByCategories(
      categories, 
      {excludedCategories: form.excludedCategories}
    )
      .then(function(catprods) {
        return [
          catprods, 
          Search.getProductsByFilterValue(filtervalues), 
          Search.getProductsByGroup(groups)
        ];
      })
      .spread(function(catprods, filterprods, groupsprods) {
        return Search.getMultiIntersection([catprods, filterprods, groupsprods]);
      })
      .then(function(productsIdsResult) {
        productsIds = productsIdsResult;
        if(filterByStore && activeStoreId){
          return Store.findOne({id:activeStoreId});
        }
        return false;
      })
      .then(function(activeStore){
        if(filterByStore && activeStore.code){
          filters.push(
            {key:activeStore.code, value: {'>':0} }
          );
        }

        if( Search.areFiltersApplied(categories, filtervalues, groups) && productsIds.length > 0 ){
          filters.push({key:'id', value: productsIds});
        }
        else if( Search.areFiltersApplied(categories, filtervalues, groups) && productsIds.length === 0 ){
          return [
            Promise.resolve(0), //total products number
            Promise.resolve([])  //products
          ];
        }
        query    = Search.applyFilters({},filters);
        query    = Search.applyOrFilters(query,orFilters);
        products = Product.find(query);
        
        if(populatePromotions){
          products = products.populate('Promotions',queryPromos)
        }
        if(populateImgs){
          products.populate('files')
        }
        products = products
          .paginate(paginate)
          .sort('Price ASC');

        return [
          Product.count(query),
          products
        ];
      })
      .spread(function(total, products) {
        return res.json({
          total: total,
          products: products
        });
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }

};

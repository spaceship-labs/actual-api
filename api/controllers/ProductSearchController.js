var util = require('util');
var ObjectId = require('mongodb').ObjectID;

module.exports = {

  advancedSearch: function(req, res){
    var form = req.params.all();
    var items = form.items || 10;
    var page = form.page || 1;
    var term = form.term || false;
    var autocomplete = form.autocomplete || false;
    var query = {};
    var querySearchAux = {};
    var keywords = form.keywords || false;
    var searchFields = ['ItemName', 'Name','ItemCode'];

    if(keywords && searchFields.length > 0){
      query.$and = [];
      keywords.forEach(function(keyword){
        var orValues = [];
        searchFields.forEach(function(field){
          var obj = {};
          obj[field] = {$regex:keyword, $options : 'i'};
          orValues.push(obj);
        });
        query.$and.push( {$or: orValues } );
      });

    }

    //sails.log.info('query:');
    //sails.log.info(util.inspect(query, false, null));

    Product.native(function(errNative, collection){
      if(errNative) console.log(errNative);

      collection.count(query, function(errCount, total){
        if(errCount) console.log(errCount);
        var find = collection.find(query);
        find.skip((page-1) * items);
        find.limit(items);
        find.toArray(function(errProds, products){
          if(errProds) console.log(errProds);
          res.json({data:products, total: total});
        })

      });
    });

  },

  searchByFilters: function(req, res){
    var form = req.params.all();
    var valuesIds = form.ids;
    var keywords = form.keywords || false;
    var term = form.term || false;
    var query = {};
    var searchFields = ['ItemName', 'Name','ItemCode','Description','DetailedColor'];

    Product_ProductFilterValue.find({productfiltervalue_Products: valuesIds}).exec(function findCB(err, relations){
      if(err){
        console.log(err);
      }
      var auxProductsIds = [];
      var productsIds = [];
      relations.forEach(function(relation){
        auxProductsIds.push(relation.product_FilterValues);
      });
      auxProductsIds = _.uniq(auxProductsIds);
      auxProductsIds.forEach(function(productId){
        var matches = _.where(relations, {product_FilterValues: productId});
        if(matches.length == valuesIds.length){
          productsIds.push(productId);
        }
      });

      if(searchFields.length > 0 && term){
        query.or = [];
        for(var i=0;i<searchFields.length;i++){
          var field = searchFields[i];
          var obj = {};
          obj[field] = {contains:term};
          query.or.push(obj);
        }
      }

      if(keywords && searchFields.length > 0){
        query.$and = [];
        keywords.forEach(function(keyword){
          var orValues = [];
          searchFields.forEach(function(field){
            var obj = {};
            //obj[field] = {contains:keyword};
            obj[field] = {$regex:keyword, $options : 'i'};
            orValues.push(obj);
          });
          query.$and.push( {$or: orValues } );
        });

      }

      productsIds = productsIds.map(function(id){
        return ObjectId(id);
      });

      query._id = {$in: productsIds};


      //sails.log.info('query:');
      //sails.log.info(util.inspect(query, false, null));

      Product.native(function(err, collection){
        if(err) console.log(err);
        collection.find(query).toArray(function(errProds, products){
          if(errProds) console.log(errProds);
          res.json(products);
        })
      });

    });

  }

}

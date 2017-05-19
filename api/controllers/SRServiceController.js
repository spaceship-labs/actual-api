var Promise = require('bluebird');

module.exports = {

  find: function(req, res){
    var form = req.allParams();
    var items = form.items || 10;
    var page = form.page || 1;
    var query = {
      InvntItem: 'N',
      skip: (page-1) * items,
      limit: items
    };
    var sort = 'DiscountPrice ASC';

    var promises = [
      Product.find(query).sort(sort),
      Product.count(query)
    ]

    Promise.all(promises)
      .then(function(results){
        var services = results[0];
        var count  = results[1];
        res.json({
          services: services,
          total: count
        });
      })
      .catch(function(err){
        res.negotiate(err);
      })
  }

}
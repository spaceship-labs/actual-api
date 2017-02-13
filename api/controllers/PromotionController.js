var Promise = require('bluebird');

module.exports = {
  create: function(req,res){
    var form = req.params.all();
    Promotion.create(form)
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  find: function(req, res){
    var form = req.params.all();
    var model = 'promotion';
    var extraParams = {
      searchFields: ['name','code'],
      selectFields: form.fields
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Promotion.findOne({id:id})
      .then(function(promo){
        res.json(promo);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },
  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Promotion.update({id:id}, form)
      .then(function(promo){
        res.json(promo);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  searchPromotionProducts: function(req, res){
    var form = req.allParams();
    var sa = form.sa;
    var discount = form.discount;
    var queryProducts = {
      Active: 'Y',
      U_Empresa: sa,
      Discount: discount
    };

    sails.log.info('queryProducts', queryProducts);

    Product.find(queryProducts)
      .then(function(products){
        res.json(products);
      })  
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });      
  },

  getPromotionProducts: function(req, res){
    var form = req.params.all();
    var id = form.id;

    Promotion.findOne({id:id})
      .then(function(promotion){
        if(!promotion){
          return Promise.reject(new Error('Promoción no he encontrada'));
        }

        var sa = form.sa;
        var discount = form.discount;
        var queryProducts = {
          Active: 'Y',
          U_Empresa: sa,
          Discount: discount
        };

        sails.log.info('queryProducts', queryProducts);

        return Product.find(queryProducts);
      })
      .then(function(products){
        res.json(products);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });

  }

};

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

    var saQuery = {sa:sa};
    var queryProducts = {
      Active: 'Y',
      U_Empresa: sa,
      //Discount: discount
    };

    if(sa === PromotionService.STUDIO_CODE){
      delete queryProducts.U_Empresa;
      queryProducts.or = [
        {U_Empresa: PromotionService.STUDIO_CODE},
        {U_Empresa: PromotionService.AMBAS_CODE},
      ];
    }

    Product.find(queryProducts).sort('Discount ASC')
      .then(function(products){
        res.json(products);
      })  
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });      
  },

};

var Promise = require('bluebird');

module.exports = {
  find: function(req, res) {
    Store.find()
      .then(function(stores){
        return res.json(stores);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  getPackagesByStore: function(req, res){
    var form        = req.params.all();
    var id          = form.id;
    var queryPromos = Search.getPromotionsQuery();
    Store.findOne({id:id})
      .populate('PromotionPackages', queryPromos)
      .then(function(store){
        res.json(store.PromotionPackages);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getSellersByStore: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Role.findOne({name:'seller'})
      .then(function(sellerRole){
        var sellerRoleId = sellerRole.id;
        return User.find({mainStore: id, role: sellerRoleId});
      })
      .then(function(sellers){
        res.json(sellers);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  getCommissionables: function(req, res) {
    var form = req.params.all();
    var store = form.store;
    Role.find({name:['seller', 'store manager']})
      .then(function(commissionables){
        var commissionables = commissionables.map(function(c){ return c.id; });
        var query = store? {mainStore: store} : {};
        query.role = commissionables;
        return User.find(query).populate('role');
      })
      .then(function(sellers){
        res.json(sellers);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  getAll: function(req, res) {
    Store.find().then(function(stores) {
      return res.json(stores);
    })
    .catch(function(err){
      console.log(err);
      res.negotiate(err);
    });    
  },

  countSellers: function(req, res) {
    var form  = req.allParams();
    var store = form.store;
    Role
      .findOne({name: 'seller'})
      .then(function(role) {
        return User.count({
          role: role.id,
          mainStore: store
        });
      })
      .then(function(sellers) {
        return res.json(sellers);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  generateGlobalCashReport: function(req, res){
    var form = req.params.all();
    var ADMIN_ROLE_NAME = 'admin';

    if(req.user.role.name !== ADMIN_ROLE_NAME){
      return res.negotiate(new Error('No autorizado'));
    }

    ReportService.buildGlobalCashReport(form)
      .then(function(report){
        res.json(report);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

};
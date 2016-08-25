module.exports = {
  find: function(req, res) {
    Store.find().exec(function(err, stores){
      if (err) {return res.negotiate(err);}
      return res.json(stores);
    });
  },

  getPromosByStore: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var currentDate = new Date();
    var queryPromo = {
      startDate: {'<=': currentDate},
      endDate: {'>=': currentDate},
    };
    Store.findOne({id:id}).populate('Promotions', queryPromo)
      .then(function(company){
        //sails.log.info(company);
        res.json(company.Promotions);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getPackagesByStore: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var currentDate = new Date();
    var queryPromo = {
      startDate: {'<=': currentDate},
      endDate: {'>=': currentDate},
    };
    Store.findOne({id:id})
      .populate('ProductsPackages', queryPromo)
      .then(function(store){
        //sails.log.info(company);
        res.json(store.ProductsPackages);
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
        return User.find({MainStore: id, role: sellerRoleId});
      })
      .then(function(sellers){
        res.json(sellers);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getAll: function(req, res) {
    Store.find().exec(function(err, stores) {
      if (err) {return res.negotiate(err);}
      return res.json(stores);
    });
  },

  countSellersGeneral: function(req, res) {
    var form    = req.allParams();
    var company = form.company;
    Role
      .findOne({name: 'seller'})
      .then(function(role) {
        return User.count({
          role: role.id,
          MainStore: company,
          projectUser: false
        })
      })
      .then(function(sellers) {
        return res.json(sellers);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  countSellersProject: function(req, res) {
    var form    = req.allParams();
    var store = form.store;
    Role
      .findOne({name: 'seller'})
      .then(function(role) {
        return User.count({
          role: role.id,
          MainStore: store,
          projectUser: true
        })
      })
      .then(function(sellers) {
        return res.json(sellers);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  }

};

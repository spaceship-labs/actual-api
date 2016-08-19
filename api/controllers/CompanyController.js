/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Company.find().exec(function(err, companies){
      if (err) {return res.negotiate(err);}
      return res.json(companies);
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
    Company.findOne({id:id}).populate('Promotions', queryPromo)
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
    Company.findOne({id:id})
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
        return User.find({companyMain: id, role: sellerRoleId});
      })
      .then(function(sellers){
        res.json(sellers);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }

};


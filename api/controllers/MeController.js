module.exports = {
  update: function(req, res) {
    var form = req.params.all();
    var user = req.user;
    delete form.password;
    delete form.email;

    //@param {Object User} form
    //@param {Object User} req.user    
    User.update({id: user.id}, form)
      .then(function(user){
        res.json(user[0] || false);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },
  
  activeStore: function(req, res) {
    var activeStoreId = req.user.activeStore.id || req.headers.activestoreid;
    
    //@param {id/hexadecimal} activeStoreId
    Store.findOne({id:activeStoreId})
      .then(function(store){
        res.json(store);
      })
      .catch(function(err){{
        console.log(err);
        res.negotiate(err);
      }});
  },

  generateCashReport: function(req, res){
    /*
    @params {Object User} req.user
    @params {Object} form
    Example: 
    {
      startDate: Wed Jan 03 2018 15:50:26 GMT-0500 (EST),
      endDate: Wed Jan 03 2018 17:50:26 GMT-0500 (EST)
    }
    */

    var form = req.params.all();
    var user = req.user;
    var startDate = form.startDate || new Date();
    var endDate = form.endDate || new Date();
    var q = {
      User: user.id,
      createdAt: { '>=': startDate, '<=': endDate }
    };
    Payment.find(q).populate('Order').populate('Store')
      .then(function(payments){
        res.json(payments);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  generateManagerCashReport: function(req, res){
    /*
    @params {Object User} req.user
    */
    var form = req.params.all();
    var STORE_MANAGER_ROLE_NAME = 'store manager';
    form.populateOrders = true;
    form.userId = req.user.id;

    if(req.user.role.name !== STORE_MANAGER_ROLE_NAME ){
      return res.negotiate(new Error('No autorizado'));
    }

    StoreService.generateMagerCashReprot(form)
      .then(function(report){
        res.json(report);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },  


};


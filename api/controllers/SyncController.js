var Promise = require('bluebird');

module.exports = {
  syncProductByItemCode: function(req, res){
    sails.log.info('sync');
    var form = req.allParams();
    var itemCode = form.itemcode;

    SyncService.syncProductByItemCode(itemCode)
      .then(function(result){
        sails.log.info('result', result);
        resultSync = JSON.parse(result.value);
        if(resultSync.type === 'Error' || resultSync.result !== itemCode){
          return Promise.reject(new Error(resultSync.result));
        }

        return Common.nativeFindOne({ItemCode: itemCode}, Product);
      })
      .then(function(product){
        res.json(product);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });

  },

  syncClientsDiscounts: function(req,res){
    SyncService.syncClientsDiscounts()
      .then(function(result){
        sails.log.info('result', result);
        res.ok();
      })
      .catch(function(err){
        console.log('err',err);
        res.negotiate(err);
      });
  },

  fixOrders: function(req, res){
  	//Common.reassignOrdersDates();
  }
};


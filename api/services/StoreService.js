var Promise = require('bluebird');

module.exports = {
	generateStoreCashReportBySellers: generateStoreCashReportBySellers,
	generateStoresCashReport: generateStoresCashReport
};

function generateStoresCashReport(params){
  params.populateOrders = false;

	return Store.find({})
		.then(function(stores){
			return Promise.map(stores,function(store){
        return getPaymentsByStore(store.id, params)
          .then(function(storePayments){
            store = store.toObject();
            store.Payments = storePayments;
            return store;
          });
			});
		})
		.then(function(mappedStores){
			return mappedStores;
		});
}

function getPaymentsByStore(storeId, params){
  var startDate = params.startDate || new Date();
  var endDate = params.endDate || new Date();
  var queryPayments = {};

  return getStoreSellers(storeId)
    .then(function(sellers){
      queryPayments.or = sellers.reduce(function(acum, seller){
        var query = {
          User: seller.id,
          createdAt: { '>=': startDate, '<=': endDate },
          Store: storeId
        };
        acum.push(query);
        return acum;
      }, []);

      return Payment.find(queryPayments);
    });
}

function getStoreSellers(storeId){
  return Role.findOne({name:'seller'})
    .then(function(sellerRole){
      var sellerRoleId = sellerRole.id;
      return User.find({mainStore: storeId, role: sellerRoleId});
    });
}

function generateStoreCashReportBySellers(params){
  var storeId = params.id;
  var startDate = params.startDate || new Date();
  var endDate = params.endDate || new Date();
  var populateOrders = params.populateOrders;

  return getStoreSellers(storeId)
    .then(function(sellers){
      return Promise.map(sellers,function(seller){
        var options = {
          seller: seller, 
          startDate: startDate, 
          endDate: endDate, 
          storeId: storeId, 
          populateOrders: populateOrders          
        };

        return getPaymentsBySeller(options);
      });
    })
    .then(function(populatedSellers){
    	return populatedSellers;
    });
}

function getPaymentsBySeller(options){
  var seller = options.seller;
  var startDate = options.startDate;
  var endDate = options.endDate;
  var storeId = options.storeId;
  var populateOrders = options.populateOrders;

  var query = {
    User: seller.id,
    createdAt: { '>=': startDate, '<=': endDate },
    Store: storeId
  };  

  var findPayments = Payment.find(query);
  if(populateOrders){
    findPayments.populate('Order');
  }

  return findPayments
    .then(function(payments){
      seller = seller.toObject();
      seller.Payments = payments;
      return seller;
    });
}
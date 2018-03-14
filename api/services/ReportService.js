const Promise = require('bluebird');
const _ = require('underscore');
module.exports = {
  buildManagerCashReport,
  //For testing purposes
  buildPaymentDivisions
};

/*
  ManagerCashReport struct{
    [
      {
        id:"store.id",
        total: 19500,
        startDate: date
        endDate: date
        Sellers: [
          {
            id:"seller.id1",
            Payments:[
              id: "payment.id1"
              Order:{
                id: "order.id1"
              }
            ]
          }
        ]
      }
    ]
  }
*/
async function buildManagerCashReport(params){
  const {managerId} = params;

  const manager = await User.findOne({id:managerId}).populate('Stores');
  if(!manager){
    throw new Error('No existe el usuario');
  }
  const stores = manager.Stores;
  const storesPoulated = await Promise.mapSeries(stores, async function (store){
    const storeCashReportParams =  {
      ...params
    };
    const storeSellers = await buildStoreCashReport(store.id,storeCashReportParams);
    store = store.toObject();
    store.sellers = storeSellers;
    store.total = getStoreTotal(store);
    return store; 
  });
  const managerCashReport = {
    stores: storesPoulated,
    total: getMultipleStoresTotal(storesPoulated)
  };
  return managerCashReport;
}

async function buildStoreCashReport(storeId, params){
  const startDate = params.startDate || new Date();
  const endDate = params.endDate || new Date();
  const paymentsQuery = {};
  const {populateOrders} = params;

  const storeSellers = await getStoreSellers(storeId);
  
  const populatedSellers = await Promise.mapSeries(storeSellers, async function(seller){
    var options = {
      seller: seller, 
      startDate: startDate, 
      endDate: endDate, 
      storeId: storeId, 
      populateOrders: populateOrders          
    };

    const sellerPayments = await getPaymentsBySeller(seller, options);
    seller = seller.toObject();
    seller.Payments = sellerPayments;
    seller.divisions = buildPaymentDivisions(sellerPayments, seller.id);
    seller.total = getSellerTotal(seller);
    return seller;
  });
  
  return populatedSellers;
}

function cleanUnusedDivisions(divisions){
  const result = divisions.reduce(function(acum, division){
    division.subdivisions = division.subdivisions.filter(function(subdivision){
      return subdivision.payments && subdivision.payments.length > 0;
    });
    if(division.subdivisions && division.subdivisions.length > 0){
      acum.push(division);
    }
    return acum;
  }, []);
  return result;
}

function buildPaymentDivisions(payments){
  const config = {
    readLegacyMethods: true,
    readCredtiMethod: true
  };
  var paymentGroups = PaymentService.getPaymentGroups(config);
  var divisions = paymentGroups.reduce(function(acum, group){
    if(group.group == 1){
      var division = {};
      division.name = "Un solo pago";
     
      //Normal subdivisions
      division.subdivisions = group.methods.filter(function(method){
        return !method.terminals;
      }).map(function(method){
        const subdivision = {
          ...method,
          payments: _.where(payments, {type: method.type})
        }
        subdivision.total = getSubdivisionTotal(subdivision);
        if(subdivision.currency === PaymentService.currencyTypes.USD){
          subdivision.totalUsd = getSubdivisionTotal(subdivision, {currency: PaymentService.currencyTypes.USD});
        }
        return subdivision;
      });
     
      var artificialSubdivisions = getArtificialSubDivisions(payments, group.group);
      division.subdivisions = division.subdivisions.concat(artificialSubdivisions);
      division.total = getDivisionTotal(division);
      acum.push(division);
    }
    
    else{
      var auxDivisions = group.methods.map(function(method){
        var division = {name: method.name, group: method.group};
        division.subdivisions = getArtificialSubDivisions(payments, group.group, method.type);
        division.total = getDivisionTotal(division);
        return division;
      });
      acum = acum.concat(auxDivisions);
    }
    
    return acum;
  }, []);
  
  return cleanUnusedDivisions(divisions);
}

function getArtificialSubDivisions(payments, groupNumber, methodType){
  const cardPayments = payments.filter(function(payment){
    if(methodType){
      return PaymentService.isCardPayment(payment) && payment.group === groupNumber && payment.type === methodType;      
    }
    return PaymentService.isCardPayment(payment) && payment.group === groupNumber;
  });

  const artificialSubdivisionsAux = _.groupBy(cardPayments, function(payment){
    return getPaymentHash(payment);
  });
  //console.log('artificialSubdivisionsAux', artificialSubdivisionsAux);

  var artificialSubdivisions = [];
  for(var key in artificialSubdivisionsAux){
    var artificialSubdivision = {
      //Spreading props like: name, terminal, group, etc
      type: artificialSubdivisionsAux[key][0].type,
      name: artificialSubdivisionsAux[key][0].name,
      label: artificialSubdivisionsAux[key][0].type,
      terminal: artificialSubdivisionsAux[key][0].terminal,
      msi: artificialSubdivisionsAux[key][0].msi,
      groupNumber: artificialSubdivisionsAux[key][0].group,
      currency: artificialSubdivisionsAux[key][0].currency,
      payments: artificialSubdivisionsAux[key]
    };
    
    if(artificialSubdivision.terminal){
      artificialSubdivision.name = artificialSubdivision.name + ' TPV ' + Common.mapTerminalCode(artificialSubdivision.terminal);
    }
    artificialSubdivision.total = getSubdivisionTotal(artificialSubdivision);
    artificialSubdivisions.push(artificialSubdivision);
  }
  return artificialSubdivisions;
}

function getPaymentHash(payment){
  return payment.type + '#' + (payment.terminal || '');
}

async function getPaymentsBySeller(seller, options){
  const {startDate, endDate, storeId, populateOrders} = options;

  const paymentsQuery = {
    User: seller.id,
    createdAt: { '>=': startDate, '<=': endDate },
    Store: storeId
  };  
  var sellerPayments;

  if(populateOrders){
    sellerPayments = await Payment.find(paymentsQuery).populate('Order');
  }else{
    sellerPayments = await Payment.find(paymentsQuery);
  }

  return sellerPayments;
}


async function getStoreSellers(storeId){
  const sellerRole = await Role.findOne({name: 'seller'});
  const sellerRoleId = sellerRole.id;
  const sellers = await User.find({mainStore: storeId, role: sellerRoleId});
  return sellers;  
}

function getSubdivisionTotal(subdivision, options = {currency: PaymentService.currencyTypes.MXN}){
  if(!subdivision.payments){
    return 0;
  }
  var total = subdivision.payments.reduce(function(acum, current){
    if(current.currency === PaymentService.currencyTypes.USD && options.currency === PaymentService.currencyTypes.MXN){
      acum += PaymentService.calculateUSDPayment(current, current.exchangeRate);
    }else{
      acum += current.ammount;
    }
    return acum;
  },0);

  return total;
}

function getDivisionTotal(division){
  var total = division.subdivisions.reduce(function(acum, subdivision){
    acum += subdivision.total;
    return acum;
  },0);
  return total;
}

function getMultipleSellersTotal(sellers){
  sellers = sellers || [];
  var sellersTotal = sellers.reduce(function(acum, seller){
    acum += seller.total;
    return acum;
  }, 0);
  return sellersTotal;
}

function getSellerTotal(seller){
  var generalTotal = seller.divisions.reduce(function(acum, division){
    acum += division.total;
    return acum;
  },0);
  return generalTotal;
}


function getStoreTotal(store){
  if(!store.sellers){
    return 0;
  }
  var storeTotal = store.sellers.reduce(function(acum, seller){
    acum += seller.total;
    return acum;
  },0);
  return storeTotal;
}

function getMultipleStoresTotal(stores){
  var storesTotal = stores.reduce(function(acum, store){
    acum += store.total;
    return acum;
  },0);
  return storesTotal;
}  			    

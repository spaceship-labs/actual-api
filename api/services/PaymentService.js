const Promise = require('bluebird');
const numeral = require('numeral');
const _ = require('underscore');

const CANCELED_STATUS = 'canceled';
const PAYMENT_CANCEL_TYPE = 'cancelation';
const EWALLET_TYPE = 'ewallet';
const CASH_USD_TYPE = 'cash-usd';
const TRANSFER_USD_TYPE = 'transfer-usd';
const CLIENT_BALANCE_TYPE = 'client-balance';
const CLIENT_CREDIT_TYPE = 'client-credit';
const EWALLET_GROUP_INDEX = 0;
const DEFAULT_EXCHANGE_RATE   = 18.78;
const CURRENCY_USD = 'usd';

const VALID_STORES_CODES = [
  'actual_home_xcaret',
  'actual_studio_cumbres',
  'actual_studio_malecon',
  'actual_studio_playa_del_carmen',
  'actual_studio_merida',
  'actual_puerto_cancun',
  'actual_proyect'
];

module.exports = {
  addPayment,
  calculatePaymentsTotal,
  calculatePaymentsTotalPg1,
  calculateUSDPayment,
  checkIfClientHasCreditById,
  getPaymentGroupsForEmail,
  getQuotationTotalsByMethod,
  getPaymentGroups,
  getExchangeRate,
  EWALLET_TYPE,
  CASH_USD_TYPE,
  TRANSFER_USD_TYPE,
  EWALLET_GROUP_INDEX,
  CLIENT_BALANCE_TYPE,
  CLIENT_CREDIT_TYPE,
  CURRENCY_USD,
};

async function addPayment(params, req){
  const quotationId = params.quotationid;
  const paymentGroup = params.group || 1;
  const storeCode = req.user.activeStore.code;

  params.Quotation    = quotationId;
  params.Store = req.user.activeStore.id;
  params.User = req.user.id;    

  if(VALID_STORES_CODES.indexOf(storeCode) === -1 && process.env.MODE === 'production'){
    throw new Error("La creación de pedidos para esta tienda esta deshabilitada");
  }

  const isValidStock = await StockService.validateQuotationStockById(quotationId, req.user.activeStore)
  if(!isValidStock){
    throw new Error('Inventario no suficiente');
  }

  var quotation;
  if(params.type === EWALLET_TYPE || params.type === CLIENT_BALANCE_TYPE){
    quotation = await Quotation.findOne(params.Quotation).populate('Payments').populate('Client');
  }else{
    quotation = await Quotation.findOne(params.Quotation).populate('Payments');
  }

  const client = quotation.Client;
  params.Client = client.id || client;
  const previousPayments = quotation.Payments;
  let hasEnoughFunds;

  if(params.type === EWALLET_TYPE){
    hasEnoughFunds = await EwalletService.isValidEwalletPayment(params, params.Client);
  }

  if(params.type === CLIENT_BALANCE_TYPE){
    hasEnoughFunds = await ClientBalanceService.isValidClientBalancePayment(params, params.Client);
  }

  if(params.type === EWALLET_TYPE && !hasEnoughFunds){
    throw new Error('Fondos insuficientes en monedero electronico');
  }

  if(params.type === CLIENT_BALANCE_TYPE && !hasEnoughFunds){
    throw new Error('Fondos insuficientes en balance de cliente');
  }

  const calculator = QuotationService.Calculator();
  const calculatorParams = {
    currentStoreId: req.user.activeStore.id,
    paymentGroup: paymentGroup,
    update: false,
    financingTotals: true
  };

  const exchangeRate = await getExchangeRate();
  const quotationTotals = calculator.getQuotationTotals(params.Quotation ,calculatorParams);
  const quotationTotal = quotationTotals.total;
  
  if(typeof params.Client === 'string' && params.type === CLIENT_CREDIT_TYPE){
    const hasCredit = await checkIfClientHasCreditById(params.Client);
    if(!hasCredit){
      throw new Error('Este cliente no cuenta con crédito como forma de pago');
    }
  }

  var newPaymentAmount;
  const previousAmountPaid = await calculatePaymentsTotal(previousPayments, exchangeRate);
  const ROUNDING_AMOUNT = 1;
  const quotationRemainingAmount = (quotationTotal - previousAmountPaid) + ROUNDING_AMOUNT;

  if(params.currency === CURRENCY_USD){
    newPaymentAmount = calculateUSDPayment(params, exchangeRate);
  }else{
    newPaymentAmount = params.ammount;
  }

  if(newPaymentAmount > quotationRemainingAmount){
    throw new Error('No es posible pagar mas del 100% del pedido');
  }

  const paymentCreated = await Payment.create(params);
  const quotationPayments = quotation.Payments.concat([paymentCreated]);

  const ammountPaid = await calculatePaymentsTotal(quotationPayments, exchangeRate);
  const ammountPaidPg1 = await calculatePaymentsTotalPg1(quotationPayments, exchangeRate);

  if(params.type === EWALLET_TYPE){
    const ewalletConfig = {
      quotationId: quotationId,
      userId: req.user.id,
      client: client,
      paymentId: paymentCreated.id
    };
    const appliedEwalletRecord = await EwalletService.applyEwalletRecord(params,ewalletConfig);
  }

  if(params.type === CLIENT_BALANCE_TYPE){
    const clientBalanceConfig = {
      quotationId: quotationId,
      userId: req.user.id,
      client: client,
      paymentId: paymentCreated.id              
    };
    const appliedClientBalanceRecord = await ClientBalanceService.applyClientBalanceRecord(params, clientBalanceConfig)
  }        

  const quotationUpdateParams = {
    ammountPaid: ammountPaid,
    ammountPaidPg1: ammountPaidPg1,
    paymentGroup: paymentGroup
  };
  
  const resultUpdate = await QuotationService.nativeQuotationUpdate(quotationId, quotationUpdateParams);
  delete quotation.Payments;
  quotation.ammountPaid = quotationUpdateParams.ammountPaid;
  quotation.paymentGroup = quotationUpdateParams.paymentGroup;
  
  return quotation;
  //var updatedQuotation = resultUpdate[0];
  //res.json(updatedQuotation);
}

function calculatePaymentsTotal(payments = [], exchangeRate){
  if(payments.length === 0) return 0;
  const ammounts = payments.map(function(payment){
    if(payment.currency === 'usd') {
      return calculateUSDPayment(payment, exchangeRate);
    }
    return payment.ammount;
  });
  const total = ammounts.reduce(function(paymentA, paymentB){
    return paymentA + paymentB;
  });
  return total || 0;
}

function calculatePaymentsTotalPg1(payments = [], exchangeRate){
  const paymentsG1 = _.where(payments,{group: 1});
  if(!paymentsG1 || paymentsG1.length === 0){
    return 0;
  }
  const ammounts = paymentsG1.map(function(payment){
    if(payment.currency === 'usd'){
     return calculateUSDPayment(payment, exchangeRate);
    }
    return payment.ammount;
  });

  const totalG1 = ammounts.reduce(function(paymentA, paymentB){
    return paymentA + paymentB;
  });
  
  return totalG1 || 0;
}

function calculateUSDPayment(payment, exchangeRate){
  return payment.ammount * exchangeRate;
}

async function getExchangeRate(){
  const site = await Common.nativeFindOne({handle:'actual-group'}, Site);
  return site.exchangeRate || DEFAULT_EXCHANGE_RATE;
}

async function getQuotationTotalsByMethod(quotationId, activeStore, options = {}){
  var paymentGroups = _.clone(sails.config.paymentGroups);
  const discountKeys = sails.config.discountKeys;

  const getTotalsPromises = paymentGroups.map(function(paymentGroup) {
    const params = {
      financingTotals: options.financingTotals,
      update: false,
      paymentGroup: paymentGroup.group,
      currentStoreId: activeStore.id
    };
    const calculator = QuotationService.Calculator();
    return calculator.getQuotationTotals(quotationId, params);
  });

  var totalsByGroup = await Promise.all(getTotalsPromises);
  const exchangeRate = await getExchangeRate();
  const clientHasCredit = await checkIfClientHasCreditByQuotationId(quotationId);

  if( isADiscountClient(totalsByGroup) || clientHasCredit){
    totalsByGroup = filterPaymentTotalsForDiscountClients(totalsByGroup);
    paymentGroups = filterMethodsGroupsForDiscountClients(paymentGroups);
  }

  if(clientHasCredit){
    paymentGroups = addCreditMethod(paymentGroups);
  }else{
    paymentGroups = removeCreditMethod(paymentGroups);
  }

  paymentGroups = paymentGroups.map(function(paymentGroup, index){
    paymentGroup.total = totalsByGroup[index].total || 0;
    paymentGroup.subtotal = totalsByGroup[index].subtotal || 0;
    paymentGroup.discount = totalsByGroup[index].discount || 0;
    paymentGroup.methods = paymentGroup.methods.map(function(method){
      const discountKey = discountKeys[paymentGroup.group - 1];
      method.discountKey = discountKey;
      method.total = paymentGroup.total;
      method.subtotal = paymentGroup.subtotal;
      method.discount = paymentGroup.discount;
      method.exchangeRate = exchangeRate;

      if(method.type === CASH_USD_TYPE){
        const exchangeRateString  = numeral(exchangeRate).format('0,0.00');
        method.description = 'Tipo de cambio '+ exchangeRateString +' MXN';
      }
      else if(method.type === EWALLET_TYPE){
        //var balance = vm.quotation.Client.ewallet || 0;
        //m.description = getEwalletDescription(balance);
      }
      return method;
    });

    return paymentGroup;
  });
  
  const currentDate = new Date();
  const query = {
    startDate: {'<=': currentDate},
    endDate: {'>=': currentDate},
  };
  const validMethods = await PMPeriod.findOne(query);
  const activeKeys = sails.config.paymentGroupsKeys;
  paymentGroups = paymentGroups.filter(function(m) {
    var index = m.group - 1;
    return validMethods[activeKeys[index]];
  });

  return paymentGroups;
}

function isADiscountClient(paymentTotals){
  return _.some(paymentTotals, function(paymentTotal){
    return paymentTotal.appliesClientDiscount;
  });
}

async function checkIfClientHasCreditByQuotationId(quotationId){
  const quotation = await Quotation.findOne({id: quotationId}).populate('Client');
  if(!quotation || !quotation.Client){
    return false;
  }
  const currentDate = new Date();
  const creditQuery = {
    Name: quotation.Client.CardCode,
    U_Vigencia: {'>=': currentDate}
  };
  const credit = await ClientCredit.findOne(creditQuery);
  if( credit && !_.isUndefined(credit) ){
    return credit;
  }
  return false;
}

async function checkIfClientHasCreditById(clientId){
  const client = await Client.findOne({id: clientId});
  if(!client){
    return false;
  }
  const currentDate = new Date();
  const creditQuery = {
    Name: client.CardCode,
    U_Vigencia: {'>=': currentDate}
  };
  const credit = await ClientCredit.findOne(creditQuery);
  sails.log.info('credit', credit);
  if( credit && !_.isUndefined(credit) ){
    return credit;
  }    

  return false;
}

function filterPaymentTotalsForDiscountClients(paymentTotals){
  return paymentTotals.filter(function(paymentTotal){
    return paymentTotal.paymentGroup === 1;
  });
}

function filterMethodsGroupsForDiscountClients(methodsGroups){
  return methodsGroups.filter(function(mg){
    return mg.group === 1;
  });
}

async function getPaymentGroupsForEmail(quotation, activeStore) {
  var paymentGroups = await getQuotationTotalsByMethod(quotation, activeStore)
  
  const fixedMethods = [{
    name: '1 pago de contado',
    cards: 'Efectivo, cheque, deposito, transferencia, Visa, Mastercard, American Express',
    total: numeral(paymentGroups[0].total).format('0,0.00'),
  }];
  paymentGroups = paymentGroups.slice(1);

  const methodsForEmail  = paymentGroups.reduce(function(acum, current) {
    var grouped = _.groupBy(current.methods, 'mainCard');
    for (var k in grouped) {
      var msi = _.every(grouped[k], function(method) { return method.msi; });
      var merged = grouped[k].reduce(function(a, b) {
        return {
          name:  msi ? [a.msi, b.msi].join(', ') + ' Meses sin intereses' : [a.name, b.name].join(', '),
          cards: a.cards,
          total: a.total,
        };
      });
      acum = acum.concat(merged);
    }
    return acum;
  }, []);
  const methodsForEmailFormatted = methodsForEmail.map(function(mi) {
    return {
      name: mi.msi ? mi.msi + ' Meses sin intereses' : mi.name,
      cards: mi.cards.join(','),
      total: numeral(mi.total).format('0,0.00'),
    };
  });
  return fixedMethods.concat(methodsForEmailFormatted);
}

function getPaymentGroups(options = {}){
  let paymentGroups = _.clone(sails.config.paymentGroups);
  if(options.readCreditPayments){
    paymentGroups = addCreditMethod(paymentGroups);
  }
  return paymentGroups;
}

function addCreditMethod(methodsGroups){
  return methodsGroups.map(function(mg){
    if(mg.group === 1){
      var isCreditMethodAdded = _.findWhere(mg.methods,{type:'client-credit'});
      if(!isCreditMethodAdded){
        mg.methods.unshift(creditMethod);
      }
    }
    return mg;
  });
}

function removeCreditMethod(methodsGroups){
  return methodsGroups.map(function(mg){
    if(mg.group === 1){
      var creditMethodIndex = -1;
      var isCreditMethodAdded = _.find(mg.methods,function(item, index){
        if(item.type === 'client-credit'){
          creditMethodIndex = index;
          return true;
        }else{
          return false;
        }
      });

      if(isCreditMethodAdded && creditMethodIndex > -1){
        mg.methods.splice(creditMethodIndex, 1);
      }
    }
    return mg;
  });
}

function remove12msiMethodFromGroup4(methodsGroups){
  return methodsGroups.map(function(mg){
    if(mg.group === 4){
      var _12msiMethodIndex = -1;
      var is12msiMethodAdded = _.find(mg.methods,function(item, index){
        if(item.type === '12-msi'){
          _12msiMethodIndex = index;
          return true;
        }else{
          return false;
        }
      });
      
      if(is12msiMethodAdded && _12msiMethodIndex > -1){
        mg.methods.splice(_12msiMethodIndex, 1);
      }
    }
    return mg;
  });  
}

const creditMethod = {
  label:'Credito',
  name: 'Credito',
  type: 'client-credit',
  description: '',
  currency: 'mxn',
  needsVerification: false
};

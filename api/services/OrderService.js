const _ = require('underscore');
const Promise = require('bluebird');

const INVOICE_SAP_TYPE = 'Invoice';
const ORDER_SAP_TYPE = 'Order';
const ERROR_SAP_TYPE = 'Error';
const BALANCE_SAP_TYPE = 'Balance';

module.exports = {
	create,
	getCountByUser,
  getTotalsByUser,
  isValidOrderCreated,
  collectSapErrors,
  collectSapErrorsBySapOrder,
  checkIfSapOrderHasReference,
  checkIfSapOrderHasPayments,
  everyPaymentIsClientBalanceOrCredit,
  extractBalanceFromSapResult,
  getPaidPercentage
};

function getCountByUser(form){
  var userId = form.userId;
  var fortNightRange = Common.getFortnightRange();

  //Fortnight range by default
  var startDate = form.startDate || fortNightRange.start;
  var endDate = form.endDate || fortNightRange.end;
  var queryDateRange = {
    User: userId,
    createdAt: { '>=': startDate, '<=': endDate }
  };
  var queryfortNightRange = {
    User: userId,
    createdAt: { '>=': fortNightRange.start, '<=': fortNightRange.end }
  };

  return Promise.join(
    Order.count(queryfortNightRange),
    Order.count(queryDateRange)
  )
    .then(function(results){
      var response = {
        fortnight: results[0],
        dateRange: results[1]
      };
      return response;
    });
}

function getTotalsByUser(form){
  var userId = form.userId;
  var getFortnightTotals = !_.isUndefined(form.fortnight) ? form.fortnight : true;
  var fortNightRange = Common.getFortnightRange();

  //Fortnight range by default
  var startDate = form.startDate || fortNightRange.start;
  var endDate = form.endDate || fortNightRange.end;
  var queryDateRange = {
    User: userId,
    createdAt: { '>=': startDate, '<=': endDate }
  };
  var queryfortNightRange = {
    User: userId,
    createdAt: { '>=': fortNightRange.start, '<=': fortNightRange.end }
  };

  var props = {
    totalDateRange: Order.find(queryDateRange).sum('total')
  };
  if(getFortnightTotals){
    props.totalFortnight = Order.find(queryfortNightRange).sum('total');
  }

  //Find all totals
  return Promise.props(props)
    .then(function(result){
      var totalFortnight = 0;
      var totalDateRange = 0;
      if(getFortnightTotals && result.totalFortnight.length > 0){
        totalFortnight = result.totalFortnight[0].total;
      }
      if(result.totalDateRange.length > 0){
        totalDateRange = result.totalDateRange[0].total;
      }
      var response = {
        fortnight: totalFortnight || false,
        dateRange: totalDateRange
      };
      return response;
    });

}

async function create(form, currentUser){
  const {quotationId} = form; 
  var opts = {
    //paymentGroup: form.paymentGroup || 1,
    updateDetails: true,
    currentStoreId: currentUser.activeStore.id
  };
  var SlpCode = -1;
  const currentStore = currentUser.activeStore;

  //Validating if quotation doesnt have an order assigned
  const previousOrder = await Order.findOne({Quotation: quotationId});
  if(previousOrder){
    const frontUrl = process.env.baseURLFRONT || 'http://ventas.miactual.com';
    const orderUrl = frontUrl + '/checkout/order/' + order.id;
    throw new Error('Ya se ha creado un pedido sobre esta cotización : ' + orderUrl);
  }

  const isValidStock = await StockService.validateQuotationStockById(quotationId, currentUser.activeStore);
  const quotationPayments = await Payment.find({Quotation: quotationId}).sort('createdAt ASC');    
  if(!isValidStock){
    throw new Error('Inventario no suficiente para crear la orden');
  }
  opts.paymentGroup = QuotationService.getGroupByQuotationPayments(quotationPayments);

  const calculator = QuotationService.Calculator();
  await calculator.updateQuotationTotals(quotationId, opts);
  const quotation = await Quotation.findOne({id: quotationId})
    .populate('Payments', {status: {'!':PaymentService.statusTypes.CANCELED}})
    .populate('Details')
    .populate('Address')
    .populate('User')
    .populate('Client')
    .populate('Broker')
    .populate('EwalletRecords');

  console.log('quotation payments', quotation.Payments);

  if(!quotation.Client){
    throw new Error('No hay un cliente asociado a esta cotización')
  }

  if(quotation.Client.LicTradNum && !ClientService.isValidRFC(quotation.Client.LicTradNum)){
    throw new Error('El RFC del cliente no es valido')
  }
        
  const fiscalAddress = await FiscalAddress.findOne({CardCode:quotation.Client.CardCode});

  if(!fiscalAddress){
    throw new Error('No hay una dirección fiscal asociada al cliente')
  }

  if(quotation.Order){
    const frontUrl = process.env.baseURLFRONT || 'http://ventas.miactual.com';
    const orderUrl = frontUrl + '/checkout/order/' + quotation.Order;
    throw new Error('Ya se ha creado un pedido sobre esta cotización : ' + orderUrl)
  }

  if(!quotation.Details || quotation.Details.length === 0){
    throw new Error('No hay productos en esta cotización')
  }

  const user = await User.findOne({id: quotation.User.id}).populate('Seller');

  if(!user){
    throw new Error("Esta cotización no tiene un vendedor asignado")
  }

  if(user.Seller){
    SlpCode = user.Seller.SlpCode;
  }

  const paymentsIds = quotation.Payments.map(function(p){return p.id;});
  var orderParams = {
    source: quotation.source,
    ammountPaid: quotation.ammountPaid,
    total: quotation.total,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    paymentGroup: opts.paymentGroup,
    groupCode: currentStore.GroupCode,
    totalProducts: quotation.totalProducts,
    Client: quotation.Client.id,
    CardName: quotation.Client.CardName,
    Quotation: quotationId,
    Payments: paymentsIds,
    EwalletRecords: quotation.EwalletRecords,
    ClientBalanceRecords: quotation.ClientBalanceRecords,
    User: user.id,
    CardCode: quotation.Client.CardCode,
    SlpCode: SlpCode,
    Store: opts.currentStoreId,
    Manager: quotation.Manager
  };

  if(quotation.Broker){
    orderParams.Broker = quotation.Broker.id;
  }

  const minPaidPercentage = quotation.minPaidPercentage || 100;
      
  if( getPaidPercentage(quotation.ammountPaid, quotation.total) < minPaidPercentage){
    throw new Error('No se ha pagado la cantidad minima de la orden');
  }
  
  if(minPaidPercentage < 100){
    orderParams.status = 'minimum-paid';
  }else{
    orderParams.status = 'paid';
  }
      
  if(quotation.Address){
    orderParams.Address = _.clone(quotation.Address.id);
    orderParams.address = _.clone(quotation.Address.Address);
    orderParams.CntctCode = _.clone(quotation.Address.CntctCode);

    delete quotation.Address.id;
    delete quotation.Address.Address; //Address field in person contact
    delete quotation.Address.createdAt;
    delete quotation.Address.updatedAt;
    delete quotation.Address.CntctCode;
    delete quotation.Address.CardCode;
    orderParams = _.extend(orderParams,quotation.Address);
  }

  const quotationDetails = await QuotationDetail.find({Quotation: quotation.id}).populate('Product');
  const site = await Site.findOne({handle:'actual-group'});

  var sapSaleOrderParams = {
    quotationId:      quotationId,
    groupCode:        orderParams.groupCode,
    cardCode:         orderParams.CardCode,
    slpCode:          SlpCode,
    cntctCode:        orderParams.CntctCode,
    payments:         quotation.Payments,
    exchangeRate:     site.exchangeRate,
    currentStore:     currentStore,
    quotationDetails: quotationDetails,
  };

  if(quotation.Broker){ 
    sapSaleOrderParams.brokerCode = quotation.Broker.Code;
  }

  const {response, endPoint} = await SapService.createSaleOrder(sapSaleOrderParams);
  const sapResponse = response;
  const sapEndpoint = decodeURIComponent(endPoint);
  sails.log.info('createSaleOrder response', sapResponse);

  const logToCreate = {
    content: sapEndpoint + '\n' +  JSON.stringify(sapResponse),
    User: currentUser.id,
    Store: opts.currentStoreId,
    Quotation: quotationId
  };
  
  const sapLog = await SapOrderConnectionLog.create(logToCreate);

  const sapResult = JSON.parse(sapResponse.value);
  const isValidSapResponse = isValidOrderCreated(sapResponse, sapResult, quotation.Payments);
  
  if( isValidSapResponse.error ){
    var defaultErrMsg = 'Error en la respuesta de SAP';
    var errorStr = isValidSapResponse.error || defaultErrMsg;
    if(errorStr === true){
      errorStr = defaultErrMsg;
    }
    throw new Error(errorStr);
  }
  orderParams.documents = sapResult;
  orderParams.SapOrderConnectionLog = sapLog.id;

  const orderCreated = await Order.create(orderParams);
  const orderFound = await Order.findOne({id:orderCreated.id}).populate('Details');

  //Cloning quotation details to order details
  quotation.Details.forEach(function(detail){
    detail.QuotationDetail = _.clone(detail.id);
    delete detail.id;
    orderFound.Details.add(detail);
  });
  await orderFound.save();
  const orderDetails = await OrderDetail.find({Order: orderCreated.id})
    .populate('Product')
    .populate('shipCompanyFrom');
      
  const updateFields = {
    Order: orderCreated.id,
    status: 'to-order',
    isClosed: true,
    isClosedReason: 'Order created'
  };

  const quotationUpdated = await Quotation.update({id:quotation.id} , updateFields);
  const sapOrdersReference = await saveSapReferences(sapResult, orderCreated, orderDetails)

  const ewalletProcessBalanceParams = {
    details: quotation.Details,
    storeId: opts.currentStoreId,
    orderId: orderCreated.id,
    quotationId: quotation.id,
    userId: quotation.User.id,
    client: quotation.Client
  };
  
  await processEwalletBalance(ewalletProcessBalanceParams);

  const order = orderCreated.toObject();
  order.Details = orderDetails;
  return orderCreated;
}

function isValidOrderCreated(sapResponse, sapResult, paymentsToCreate){
  sapResult = sapResult || {};
  if( sapResponse && _.isArray(sapResult)){

    if(sapResult.length <= 0){
      return {
        error: 'No fue posible crear el pedido en SAP'
      };
    }

    var sapResultWithBalance = _.clone(sapResult);
    sapResult = sapResult.filter(function(item){
      return item.type !== BALANCE_SAP_TYPE;
    });

    //If only balance was returned
    if(sapResult.length === 0){
      return {
        error: 'Documentos no generados en SAP'
      };
    }

    var everyOrderHasPayments = sapResult.every(function(sapOrder){
      return checkIfSapOrderHasPayments(sapOrder, paymentsToCreate);
    });

    var everyOrderHasFolio = sapResult.every(checkIfSapOrderHasReference);

    sails.log.info('everyOrderHasFolio', everyOrderHasFolio);
    sails.log.info('everyOrderHasPayments', everyOrderHasPayments);

    if(!everyOrderHasFolio){
      return {
        error:collectSapErrors(sapResult) || true
      };
    }
    else if(everyOrderHasPayments && everyOrderHasFolio){
      return {
        error: false
      };
    }

    var clientBalance = extractBalanceFromSapResult(sapResultWithBalance);
    console.log('clientBalance', clientBalance);
    //Important to compare directly to false
    //When using an expression like !clientBalance 
    //with clientBalance having a value of 0
    //(!clientBalance) gives true
    if(clientBalance === false){
      return {
        error: 'Balance del cliente no definido en la respuesta'
      };
    }
    
  }
  return {
    error: true
  };
}

function collectSapErrors(sapResult){
  var sapErrorsString = '';
  if(_.isArray(sapResult) ){
    var sapErrors =  sapResult.map(collectSapErrorsBySapOrder);
    sapErrorsString = sapErrors.join(', ');
  }
  return sapErrorsString;
}

function collectSapErrorsBySapOrder(sapOrder){
  if(sapOrder.type === ERROR_SAP_TYPE){
    return sapOrder.result;
  }
  return null; 
}

function checkIfSapOrderHasReference(sapOrder){
  return sapOrder.result && 
    (
      sapOrder.type === INVOICE_SAP_TYPE ||
      sapOrder.type === ORDER_SAP_TYPE
    );
}

function checkIfSapOrderHasPayments(sapOrder, paymentsToCreate){
  if( _.isArray(sapOrder.Payments) ){
    //No payments are returned when using only client balance or credit
    if(everyPaymentIsClientBalanceOrCredit(paymentsToCreate)){
      return true;
    }

    if(sapOrder.Payments.length > 0){
      return sapOrder.Payments.every(function(payment){
        return !isNaN(payment.pay) && payment.reference;
      });
    }
  }

  return false;
}

function everyPaymentIsClientBalanceOrCredit(paymentsToCreate){
  var everyPaymentIsClientBalance = paymentsToCreate.every(function(p){
    return p.type === PaymentService.CLIENT_BALANCE_TYPE || p.type === PaymentService.types.CLIENT_CREDIT;
  });  
  return everyPaymentIsClientBalance;
}


function saveSapReferences(sapResult, order, orderDetails){
  var clientBalance = extractBalanceFromSapResult(sapResult);
  var clientId = order.Client.id || order.Client;


  sapResult = sapResult.filter(function(item){
    return item.type !== BALANCE_SAP_TYPE;
  });

  var ordersSap = sapResult.map(function(orderSap){

    var orderSapReference = {
      Order: order.id,
      invoiceSap: orderSap.Invoice || null,
      document: orderSap.Order,
      PaymentsSap: orderSap.Payments.map(function(payment){
        return {
          document: payment.pay,
          Payment: payment.reference
        };
      }),
    };

    if(orderSap.type === INVOICE_SAP_TYPE){
      orderSapReference.invoiceSap = orderSap.result;
    }
    else if(orderSap.type === ORDER_SAP_TYPE){
      orderSapReference.document = orderSap.result;
    }

    if(orderSap.series && _.isArray(orderSap.series)){
      orderSapReference.ProductSeries = orderSap.series.map(function(serie){
        var productSerie =  {
          QuotationDetail: serie.DetailId,
          OrderDetail: _.findWhere(orderDetails, {QuotationDetail: serie.DetailId}),
          seriesNumbers: serie.Number
        };
        return productSerie;
      });
    }

    return orderSapReference;
  });
  
  return Promise.join(
    OrderSap.create(ordersSap),
    Client.update({id:clientId},{Balance: clientBalance})
  );
}

function extractBalanceFromSapResult(sapResult){
  var balanceItem = _.findWhere(sapResult, {type: BALANCE_SAP_TYPE});
  if(balanceItem && balanceItem.result && !isNaN(balanceItem.result)){
    return parseFloat(balanceItem.result);
  }
  return false;
}


//@params
/*
  params: {
    Details (array of objects),
    storeId
    orderId
    quotationId,
    userId (object),
    Client (object)
  }
*/
function processEwalletBalance(params){
  var ewalletRecords = [];
  var generated = 0;
  for(var i=0;i < params.details.length; i++){
    generated += params.details[i].ewallet || 0;
    if( (params.details[i].ewallet || 0) > 0){
      ewalletRecords.push({
        Store: params.storeId,
        Order: params.orderId,
        Quotation: params.quotationId,
        QuotationDetail: params.details[i].id,
        User: params.userId,
        Client: params.Client.id,
        amount: params.details[i].ewallet,
        type:'positive'
      });
    }
  }
  return Client.update({id:params.clientId},{ewallet:generated})
    .then(function(clientUpdated){
      return Promise.each(ewalletRecords, createEwalletRecord);
    });
}

function createEwalletRecord(record){
  return EwalletRecord.create(record);
}

function getPaidPercentage(amountPaid, total){
  var percentage = amountPaid / (total / 100);

  //Floating point issue precision with JS
  //TODO find fix to precision
  //Problem: sometimes ammount paid and total is equal, but percentage throws: 99.99999999999999
  //Return 100 when total and ammount paid is equal
  if(amountPaid === total){
    percentage = 100;
  }


  return percentage;
}



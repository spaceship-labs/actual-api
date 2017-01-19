var _ = require('underscore');
var Promise = require('bluebird');
var EWALLET_POSITIVE = 'positive';
var INVOICE_SAP_TYPE = 'Invoice';
var ORDER_SAP_TYPE = 'Order';
var ERROR_SAP_TYPE = 'Error';
var CLIENT_BALANCE_TYPE = 'client-balance';


module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'order';
    var extraParams = {
      searchFields: [
        'folio',
        'CardName',
        'CardCode'
      ],
      selectFields: form.fields,
      populateFields: ['Client']
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
    var order;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Order.findOne({id: id})
      .populate('Details')
      .populate('User')
      .populate('Client')
      .populate('Address')
      .populate('Payments')
      .populate('Store')
      .populate('EwalletRecords')
      .populate('Broker')
      .populate('OrdersSap')
      .then(function(foundOrder){
        order = foundOrder.toObject();
        var sapReferencesIds = order.OrdersSap.map(function(ref){
          return ref.id;
        });
        return OrderSap.find(sapReferencesIds)
          .populate('PaymentsSap')
          .populate('ProductSeries');
      })
      .then(function(ordersSap){
        order.OrdersSap = ordersSap;
        res.json(order);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  createFromQuotation: function(req, res){
    sails.log.warn('LLEGO A accion createFromQuotation');
    var form         = req.params.all();
    var quotationId  = form.quotationId;
    var opts         = {
      paymentGroup: form.paymentGroup || 1,
      updateDetails: true,
      currentStore: req.user.activeStore.id
    };
    var orderCreated = false;
    var SlpCode      = -1;
    var currentStore = false;
    var sapResponse;
    var quotation;
    var orderParams;
    var orderDetails;

    //Validating if quotation doesnt have an order assigned
    Order.findOne({Quotation: quotationId})
      .then(function(order){
        if(order){
          return Promise.reject(
            new Error('Ya se ha creado un pedido sobre esta cotización')
          );          
        }
        return StockService.validateQuotationStockById(quotationId, req.user.id);
      })
      .then(function(isValidStock){
        if(!isValidStock){
          return Promise.reject(
            new Error('Inventario no suficiente para crear la orden')
          );
        }
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id: quotationId})
          .populate('Payments')
          .populate('Details')
          .populate('Address')
          .populate('User')
          .populate('Client')
          .populate('EwalletRecords');
      })
      .then(function(quotationFound){
        quotation = quotationFound;

        if(quotation.Order){
          return Promise.reject(
            new Error('Ya se ha creado un pedido sobre esta cotización')
          );
        }

        var user = req.user;
        if(user.Seller){
          SlpCode = user.Seller.SlpCode;
        }
        var paymentsIds = quotation.Payments.map(function(p){return p.id;});
        orderParams = {
          source: quotation.source,
          ammountPaid: quotation.ammountPaid,
          total: quotation.total,
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          paymentGroup: opts.paymentGroup,
          groupCode: user.activeStore.GroupCode,
          totalProducts: quotation.totalProducts,
          Client: quotation.Client.id,
          CardName: quotation.Client.CardName,
          Quotation: quotationId,
          Payments: paymentsIds,
          EwalletRecords: quotation.EwalletRecords,
          ClientBalanceRecords: quotation.ClientBalanceRecords,
          User: user.id,
          Broker: quotation.Broker,
          CardCode: quotation.Client.CardCode,
          SlpCode: SlpCode,
          Store: opts.currentStore,
          Manager: quotation.Manager
          //Store: user.activeStore
        };

        var minPaidPercentage = quotation.minPaidPercentage || 100;
        
        if( getPaidPercentage(quotation.ammountPaid, quotation.total) < minPaidPercentage){
          return Promise.reject(
            new Error('No se ha pagado la cantidad minima de la orden')
          );
        }
        if(minPaidPercentage < 100){
          orderParams.status = 'minimum-paid';
        }else{
          orderParams.status = 'paid';
        }
        
        if(quotation.Address){
          orderParams.Address = _.clone(quotation.Address.id);
          orderParams.CntctCode = _.clone(quotation.Address.CntctCode);

          delete quotation.Address.id;
          delete quotation.Address.Address; //Address field in person contact
          delete quotation.Address.createdAt;
          delete quotation.Address.updatedAt;
          delete quotation.Address.CntctCode;
          delete quotation.Address.CardCode;
          orderParams = _.extend(orderParams,quotation.Address);
        }

        currentStore = user.activeStore;

        return [
          QuotationDetail.find({Quotation: quotation.id})
            .populate('Product'),
          Site.findOne({handle:'actual-group'})
        ];
      })
      .spread(function(quotationDetails, site){
        sails.log.info('createSaleOrder from controller');
        return SapService.createSaleOrder({
          quotationId:      quotationId,
          groupCode:        orderParams.groupCode,
          cardCode:         orderParams.CardCode,
          slpCode:          SlpCode,
          cntctCode:        orderParams.CntctCode,
          payments:         quotation.Payments,
          exchangeRate:     site.exchangeRate,
          currentStore:     currentStore,
          quotationDetails: quotationDetails
        });
      })
      .then(function(sapResponse){
        sails.log.info('createSaleOrder response', sapResponse);
        sapResult = JSON.parse(sapResponse.value);
        var isValidSapResponse = isValidOrderCreated(sapResponse, sapResult, quotation.Payments);
        sails.log.info('isValidSapResponse', isValidSapResponse);
        if( isValidSapResponse.error ){
          var defaultErrMsg = 'Error en la respuesta de SAP';
          var errorStr = isValidSapResponse.error || defaultErrMsg;
          if(errorStr === true){
            errorStr = defaultErrMsg;
          }
          return Promise.reject(new Error(errorStr));
        }
        orderParams.documents = sapResult;
        return Order.create(orderParams);
      })
      .then(function(created){
        orderCreated = created;
        return Order.findOne({id:created.id}).populate('Details');
      })
      .then(function(orderFound){
        //Cloning quotation details to order details
        quotation.Details.forEach(function(d){
          d.QuotationDetail = _.clone(d.id);
          delete d.id;
          orderFound.Details.add(d);
        });
        return orderFound.save();
      })
      .then(function(){
        return OrderDetail.find({Order: orderCreated.id})
          .populate('Product')
          .populate('shipCompanyFrom');
      })
      .then(function(orderDetailsFound){
        orderDetails = orderDetailsFound;
        return StockService.substractProductsStock(orderDetails);
      })
      .then(function(){
        var updateFields = {
          Order: orderCreated.id,
          status: 'to-order',
          isClosed: true,
          isClosedReason: 'Order created'
        };
        return [
          Quotation.update({id:quotation.id} , updateFields),
          saveSapReferences(sapResult, orderCreated.id, orderDetails)
        ];
      })
      .spread(function(quotationUpdated, sapOrdersReference){
        var params = {
          details: quotation.Details,
          storeId: opts.currentStore,
          orderId: orderCreated.id,
          quotationId: quotation.id,
          userId: quotation.User.id,
          client: quotation.Client
        };
        return processEwalletBalance(params);
      })
      .then(function(){
        //RESPONSE
        res.json(orderCreated);

        //STARTS EMAIL SENDING PROCESS
        return Order.findOne({id:orderCreated.id})
          .populate('User')
          .populate('Client')
          .populate('Payments')
          .populate('EwalletRecords')
          .populate('Address');
      })
      .then(function(order){
        return [
          Email.sendOrderConfirmation(order.id),
          Email.sendFreesale(order.id),
        ];
      })
      .spread(function(orderSent, freesaleSent){
        sails.log.info('Email de orden enviado');
        //RESPONSE
        //res.json(orderCreated);        
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getCountByUser: function(req, res){
    var form = req.params.all();
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

    Promise.join(
      Order.count(queryfortNightRange),
      Order.count(queryDateRange)
    )
      .then(function(results){
        var response = {
          fortnight: results[0],
          dateRange: results[1]
        };
        res.json(response);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();
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
    Promise.props(props)
      .then(function(result){
        var totalFortnight = 0;
        var totalDateRange = 0;
        if(getFortnightTotals && result.totalFortnight.length > 0){
          totalFortnight = result.totalFortnight[0].total;
        }
        if(result.totalDateRange.length > 0){
          totalDateRange = result.totalDateRange[0].total;
        }
        res.json({
          fortnight: totalFortnight || false,
          dateRange: totalDateRange
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }

};

function isValidOrderCreated(sapResponse, sapResult, paymentsToCreate){
  sapResult = sapResult || {};
  if( sapResponse && _.isArray(sapResult)){

    if(sapResult.length <= 0){
      return {
        error: 'No fue posible crear el pedido en SAP'
      };
    }

    var everyOrderHasPayments = sapResult.every(function(sapOrder){
      return checkIfSapOrderHasPayments(sapOrder, paymentsToCreate);
    });

    var everyOrderHasFolio    = sapResult.every(checkIfSapOrderHasReference);

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

    //No payments are returned when using only client balance
    var everyPaymentIsClientBalance = paymentsToCreate.every(function(p){
      return p.type === CLIENT_BALANCE_TYPE;
    });

    if(everyPaymentIsClientBalance){
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

function saveSapReferences(sapResult, orderId, orderDetails){
  sails.log.info('sapResult', sapResult);
  var ordersSap = sapResult.map(function(orderSap){
    sails.log.info('orderSap', orderSap);

    var orderSapReference = {
      Order: orderId,
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
  return OrderSap.create(ordersSap);
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

  var clientBalance = (params.client.ewallet || 0) + generated;
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
  return percentage;
}

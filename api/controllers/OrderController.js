var _ = require('underscore');
var Promise = require('bluebird');
var EWALLET_POSITIVE = 'positive';

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'order';
    var extraParams = {
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
      .then(function(order){
        res.json(order);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  createFromQuotation: function(req, res){
    var form = req.params.all();
    var quotationId = form.quotationId;
    var opts = {
      paymentGroup: form.paymentGroup || 1,
      updateDetails: true,
    };
    var quotation;
    var orderParams;
    var orderCreated = false;
    var SlpCode = -1;
    var currentStore = false;

    StockService.validateQuotationStockById(quotationId, req.user.id)
      .then(function(isValidStock){
        if(!isValidStock){
          return Promise.reject(new Error('Inventario no suficiente para crear la orden'));
        }
        return User.findOne({id: req.user.id});
      })
      .then(function(currentUser){
        opts.currentStore = currentUser.activeStore;
        var calculator = Prices.Calculator();
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
        return User.findOne({id:quotation.User.id})
          .populate('activeStore')
          .populate('Seller');
      })
      .then(function(user){
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
          Quotation: quotationId,
          Payments: paymentsIds,
          EwalletRecords: quotation.EwalletRecords,
          User: user.id,
          Broker: quotation.Broker,
          Address: _.clone(quotation.Address.id) || false,
          CardCode: quotation.Address.CardCode,
          CntctCode: quotation.Address.CntctCode,
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
        delete quotation.Address.id;
        delete quotation.Address.Address; //Address field in person contact
        orderParams = _.extend(orderParams, quotation.Address);
        /*
        sails.log.info('orderParams');
        sails.log.info(orderParams);
        */
        currentStore = user.activeStore;

        return [
          QuotationDetail.find({Quotation: quotation.id})
            .populate('Product'),
          Site.findOne({handle:'actual-group'})
        ];
      })
      .spread(function(quotationDetails, site){
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
      .then(function(sapResult){
        if(sapResult.value){
          sapResult.value = JSON.parse(sapResult.value);
        }
        sails.log.info('sapResult createOrder', sapResult);
        if(!sapResult.value || !_.isArray(sapResult.value)){
          return Promise.reject('Error en la respuesta de SAP');
        }
        orderParams.documents = sapResult.value;
        return Order.create(orderParams);        
      })
      .then(function(created){
        orderCreated = created;
        return Order.findOne({id:created.id}).populate('Details');
      })
      .then(function(orderFound){
        //Cloning quotation details to order details
        quotation.Details.forEach(function(d){
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
      .then(function(orderDetails){
        return StockService.substractProductsStock(orderDetails);
      })
      .then(function(){
        var updateFields = {
          Order: orderCreated.id,
          status: 'to-order',
          isClosed: true,
          isClosedReason: 'Order created'
        };
        return Quotation.update({id:quotation.id} , updateFields);
      })
      .then(function(){
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
        Email.sendOrderConfirmation(order.id);
      })
      .then(function(emailSent){
        sails.log.info('Email de orden enviado');
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

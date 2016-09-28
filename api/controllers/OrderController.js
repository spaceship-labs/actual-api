var _ = require('underscore');
var Promise = require('bluebird');
var EWALLET_POSITIVE = 'positive';

module.exports = {
  create: function(req, res){
    var form = req.params.all();
    Order
      .create(form)
      .then(function(order) {
        return Email.sendOrderConfirmation(order.id);
      })
      .then(function(order) {
        return res.json(order);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'order';
    var searchFields = [];
    var selectFields = form.fields;
    var populateFields = ['Client'];
    Common.find(model, form, searchFields, populateFields, selectFields)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  test: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var order;
    var details;
    var orderPromise = Order.findOne({id: id})
      .populate('User')
      .populate('Client')
      .populate('Address')
      .populate('Payments')
      .populate('Store')
      .populate('EwalletRecords');
    var detailsPromise = OrderDetail.find({Order: id})
      .populate('Product');

    Promise.props({order:orderPromise, details:detailsPromise})
      .then(function(result){
        order = result.order;
        details = result.details;
        return User.findOne({id: order.User.id})
          .populate('SlpCode');
      })
      .then(function(user){
        return SapService.buildSaleOrderRequestParams(
          order,
          order.Client,
          user.SlpCode[0].id,
          order.Address,
          details
        );
      })
      .then(function(url){
        res.json(url);
      })
      .catch(function(err){
        console.log('err', err);
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
    User.findOne({id:req.user.id}).populate('SlpCode')
      .then(function(u){
        opts.currentStore = u.activeStore;
        var calculator = Prices.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id: quotationId})
          .populate('Payments')
          .populate('Details')
          .populate('Address')
          .populate('User')
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
          .populate('SlpCode');
      })
      .then(function(user){
        if(user.SlpCode && user.SlpCode.length > 0){
          SlpCode = user.SlpCode[0].id;
        }
        var payments = quotation.Payments.map(function(p){return p.id;});
        orderParams = {
          ammountPaid: quotation.ammountPaid,
          total: quotation.total,
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          paymentGroup: opts.paymentGroup,
          groupCode: user.activeStore.GroupCode,
          Client: quotation.Client,
          Quotation: quotationId,
          Payments: quotation.Payments,
          EwalletRecords: quotation.EwalletRecords,
          User: user.id,
          Broker: quotation.Broker,
          Address: _.clone(quotation.Address.id) || false,
          CardCode: quotation.Address.CardCode,
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

        return QuotationDetail.find({Quotation: quotation.id})
          .populate('Product');
      })
      .then(function(quotationDetails){
        return SapService.createSaleOrder(
          orderParams.groupCode,
          orderParams.CardCode,
          SlpCode,
          orderParams.CntctCode,
          quotationDetails
        );
      })
      .then(function(sapResponse){
        var sapResult = JSON.parse(sapResponse);
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
        var updateFields = {
          Order: orderCreated.id,
          status: 'to-order'
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
          clientId: quotation.Client
        };
        return processEwalletBalance(params);
      })
      .then(function(){
        //RESPONSE
        res.json(orderCreated);

        //STARTS EMAIL SENDING PROCESS
        return [
          Order
            .findOne({id:orderCreated.id})
            .populate('User')
            .populate('Client')
            .populate('Payments')
            .populate('EwalletRecords')
            .populate('Address'),
          OrderDetail.find({Order: orderCreated.id})
            .populate('Product')
        ];
      })
      .spread(function(order, details){
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
    var monthRange = Common.getMonthDateRange();
    //Month range by default
    var startDate = form.startDate || monthRange.start;
    var endDate = form.endDate || monthRange.end;
    var foundAll = 0;
    var queryDateRange = {
      User: userId,
      createdAt: { '>=': startDate, '<=': endDate }
    };
    Promise.join(
      Order.count({User: userId}),
      Order.count(queryDateRange)
    )
      .then(function(foundAll, foundDateRange){
        res.json({
          all: foundAll,
          dateRange: foundDateRange
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();
    var userId = form.userId;
    var getAll = !_.isUndefined(form.all) ? form.all : true;
    var monthRange = Common.getMonthDateRange();
    //Month range by default
    var startDate = form.startDate || monthRange.start;
    var endDate = form.endDate || monthRange.end;
    var queryDateRange = {
      User: userId,
      createdAt: { '>=': startDate, '<=': endDate }
    };
    var props = {
      totalDateRange: Order.find(queryDateRange).sum('total')
    };
    if(getAll){
      props.total = Order.find({User: userId}).sum('total');
    }

    //Find all totals
    Promise.props(props)
      .then(function(result){
        var all = 0;
        var totalDateRange = 0;
        if(getAll && result.total.length > 0){
          all = result.total[0].total;
        }
        if(result.totalDateRange.length > 0){
          totalDateRange = result.totalDateRange[0].total;
        }
        res.json({
          all: all || false,
          dateRange: totalDateRange
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

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
        Client: params.clientId,
        amount: params.details[i].ewallet,
        type:'positive'
      });
    }
  }

  var clientBalance = (Client.ewallet || 0) + generated;
  return Client.update({id:params.clientId},{ewallet:generated})
    .then(function(clientUpdated){
      return Promise.each(ewalletRecords, createEwalletRecord);
    });
}

function createEwalletRecord(record){
  return EwalletRecord.create(record);
}

function getPaidPercentage(amountPaid, total){
  var percentage = 0;
  var percentage = amountPaid / (total / 100);
  return percentage;
}

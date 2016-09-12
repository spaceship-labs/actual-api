var _ = require('underscore');
var Promise = require('bluebird');
var EWALLET_POSITIVE = 'positive';

module.exports = {
  create: function(req, res){
    var form = req.params.all();
    Order.create(form)
      .then(function(order) {
        return [
          Order
            .findOne(order)
            .populate('User')
            .populate('Client')
            .populate('Payments')
            .populate('OrderAddress'),
          OrderDetail.find({Order: order.id})
            .populate('Product')
        ];
      })
      .spread(function(order, details){
        Email.sendOrderConfirmation(
          order,
          order.Address,
          order.User,
          order.Client,
          details,
          order.Payments,
          function(err) {
            if (err) {
              sails.console(err);
            }
          }
        );
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
      })
  },

  createFromQuotation: function(req, res){
    var form = req.params.all();
    var quotationId = form.quotationId;
    var opts = {
      paymentGroup: form.paymentGroup || 1,
      updateDetails: true,
    };
    var quotationBase = false;
    var orderCreated = false;
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
      })
      .then(function(quotation){
        quotationBase = quotation;
        if(quotation.Order){
          return Promise.reject(new Error('Ya se ha creado un pedido sobre esta cotización'));
        }
        return User.findOne({id:quotationBase.User.id}).populate('SlpCode');
      })
      .then(function(user){
        var SlpCode = -1;
        if(user.SlpCode && user.SlpCode.length > 0){
          SlpCode = user.SlpCode[0].id;
        }
        var payments = quotationBase.Payments.map(function(p){return p.id});
        var orderParams = {
          ammountPaid: quotationBase.ammountPaid,
          total: quotationBase.total,
          subtotal: quotationBase.subtotal,
          discount: quotationBase.discount,
          paymentGroup: opts.paymentGroup,
          Client: quotationBase.Client,
          Quotation: quotationId,
          Payments: quotationBase.Payments,
          EwalletRecords: quotationBase.EwalletRecords,
          User: user.id,
          Broker: quotationBase.Broker,
          Address: _.clone(quotationBase.Address.id) || false,
          CardCode: quotationBase.Address.CardCode,
          SlpCode: SlpCode,
          Store: opts.currentStore,
          Manager: quotationBase.Manager
          //Store: user.activeStore
        };

        var minPaidPercentage = quotationBase.minPaidPercentage || 100;

        if( getPaidPercentage(quotationBase.ammountPaid, quotationBase.total) < minPaidPercentage){
          return Promise.reject(new Error('No se ha pagado la cantidad minima de la orden'));
        }

        if(minPaidPercentage < 100){
          orderParams.status = 'minimum-paid';
        }else{
          orderParams.status = 'paid';
        }

        delete quotationBase.Address.id;
        delete quotationBase.Address.Address; //Address field in person contact
        orderParams = _.extend(orderParams, quotationBase.Address);

        return Order.create(orderParams);
      })
      .then(function(created){
        orderCreated = created;
        return Order.findOne({id:created.id}).populate('Details');
      })
      .then(function(orderFound){
        quotationBase.Details.forEach(function(d){
          delete d.id;
          orderFound.Details.add(d);
        });
        return orderFound.save();
      })
      .then(function(){
        var updateFields = {
          Order: orderCreated.id,
          status: 'to-order'
        }
        return Quotation.update({id:quotationBase.id} , updateFields);
      })
      .then(function(){
        var params = {
          details: quotationBase.Details,
          storeId: opts.currentStore,
          orderId: orderCreated.id,
          quotationId: quotationBase.id,
          userId: quotationBase.User.id,
          clientId: quotationBase.Client          
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
        Email.sendOrderConfirmation(
          order,
          order.Address,
          order.User,
          order.Client,
          details,
          order.Payments,
          function(err) {
            sails.log.info('Email de pedido enviado | ' + new Date());
            if (err) {
              sails.console(err);
            }
          }
        );
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
    Promise.props({
      foundAll: Order.count({User: userId}),
      foundDateRange: Order.count(queryDateRange)
    })
      .then(function(result){
        res.json({
          all: result.foundAll,
          dateRange: result.foundDateRange
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
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
          totalDateRange = result.totalDateRange[0].total
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
  var generated = params.details.reduce(function(acum, detail){
    acum += detail.ewallet || 0;
    return acum;
  },0);
  var ewalletRecord = {
    Store: params.storeId,
    Order: params.orderId,
    Quotation: params.quotationId,
    User: params.userId,
    Client: params.clientId,
    amount: generated,
    type:'positive'
  };
  var balanceUpdated = (Client.ewallet || 0) + generated;

  return EwalletRecord.create(ewalletRecord)
    .then(function(created){
      return Client.update({id:params.clientId},{ewallet:balanceUpdated});
    })
    .then(function(clientUpdated){
      return;
    })
}

function getPaidPercentage(amountPaid, total){
  var percentage = 0;
  var percentage = amountPaid / (total / 100);
  return percentage;
}

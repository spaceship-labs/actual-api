var _ = require('underscore');
var Promise             = require('bluebird');
var BALANCE_SAP_TYPE    = 'Balance';
var CLIENT_BALANCE_TYPE = 'client-balance';
var ERROR_SAP_TYPE      = 'Error';
var EWALLET_POSITIVE    = 'positive';
var INVOICE_SAP_TYPE    = 'Invoice';
var ORDER_SAP_TYPE      = 'Order';


module.exports = {
  sendOrderEmail: function(req, res){
    var form = req.params.all();
    var orderId = form.id;
    //@param {id/hexadecimal} orderId
    Email.sendOrderConfirmation(orderId)
      .then(function(){
        res.ok();
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

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
      populateFields: ['Client','Broker']
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
    
    //@param {id/hexadecimal} form.id
    var id = form.id;
    var order;
    if( !isNaN(id) ){
      //id = parseInt(id);
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
      .populate('SapOrderConnectionLog')
      .populate('AlegraLogs')
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

  getInvoicesLogs: function(req, res){
    var form = req.params.all();
    var orderId = form.orderId;

    //@param {id/hexadecimal} form.orderId
    AlegraLog.find({Order: orderId})
      .then(function(logs){
        res.json(logs);
      })
      .catch(function(err){
        console.log('err' , err);
        res.negotiate(err);
      });
  },

  createFromQuotation: function(req, res){
    var form = req.params.all();
    var order;
    var responseSent = false;
    var orderDetails;

    //@param {Object Order} form
    //@param {Object User} req.user
    OrderService.createFromQuotation(form, req.user)
      .then(function(orderCreated){
        //RESPONSE
        res.json(orderCreated);
        responseSent = true;
        order = orderCreated;
        orderDetails = orderCreated.Details;

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
          InvoiceService.createOrderInvoice(order.id),
          StockService.syncOrderDetailsProducts(orderDetails)
        ];
      })
      .spread(function(orderSent, freesaleSent, invoice, productsSynced){
      //.spread(function(orderSent, freesaleSent){
        console.log('Email de orden enviado: ' + order.folio);
        console.log('productsSynced', productsSynced);
        console.log('generated invoice', invoice);
      })
      .catch(function(err){
        console.log(err);
        if(!responseSent){
          res.negotiate(err);
        }
      });
  },

  getCountByUser: function(req, res){
    var form = req.params.all();

    //@param {Object} form
    /*
    Example:
    {
      userId: <MongoId>,
      startDate: Wed Jan 03 2018 15:50:26 GMT-0500 (EST)
      endDate: Wed Jan 03 2018 16:50:26 GMT-0500 (EST)
    }
    */
    OrderService.getCountByUser(form)
      .then(function(result){
        res.json(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();

    //@param {Object} form
    /*
    Example:
    {
      userId: <MongoId>,
      startDate: Wed Jan 03 2018 15:50:26 GMT-0500 (EST)
      endDate: Wed Jan 03 2018 16:50:26 GMT-0500 (EST)
      fortnight: true/false
    }
    */
    OrderService.getTotalsByUser(form)
      .then(function(result){
        res.json(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }

};


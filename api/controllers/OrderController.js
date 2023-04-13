module.exports = {
  sendOrderEmail: function(req, res){
    var form = req.allParams();
    var orderId = form.id;
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
    var form = req.allParams();
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
    var form = req.allParams();
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
    var form = req.allParams();
    var orderId = form.orderId;

    AlegraLog.find({Order: orderId})
      .then(function(logs){
        res.json(logs);
      })
      .catch(function(err){
        console.log('err' , err);
        res.negotiate(err);
      });
  },

  async create(req, res){
    var form = req.allParams();
    var responseSent = false;

    try{
      const orderCreated = await OrderService.create(form, req.user);
      //RESPONSE
      res.json(orderCreated);
      responseSent = true;
      const orderDetails = orderCreated.Details;

      //STARTS EMAIL SENDING PROCESS
      const order = await Order.findOne({id:orderCreated.id})
        .populate('User')
        .populate('Client')
        .populate('Payments')
        .populate('EwalletRecords')
        .populate('Address');

        await Email.sendOrderConfirmation(order.id);
        await Email.sendFreesale(order.id);
        const invoice = await InvoiceService.createOrderInvoice(order.id);
        const syncProducts = await StockService.syncOrderDetailsProducts(orderDetails)

        console.log('Email de orden enviado: ' + order.folio);
        console.log('productsSynced', syncProducts);
        console.log('generated invoice', invoice);
    }
    catch(err){
      console.log(err);
      if(!responseSent){
        return res.negotiate(err);
      }    
    }
  },

  async cancel(req, res){
    const {id} = req.allParams();
    try{
      const canceledOrder = await OrderService.cancel(id);
      return res.json(canceledOrder);
    }catch(err){
      console.log('err', err);
      return res.negotiate(err);
    }
  },

  getCountByUser: function(req, res){
    var form = req.allParams();
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
    var form = req.allParams();
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


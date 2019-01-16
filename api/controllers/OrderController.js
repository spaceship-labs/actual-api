module.exports = {
  async index(req, res) {
    try {
      const { page = 1, limit = 10 } = req.allParams();
      const orders = await Order.find()
        .populate('Client')
        .populate('OrdersSap')
        .paginate({
          page,
          limit,
        })
        .sort('createdAt DESC');
      const total = await Order.count();
      const results = { orders, total };
      res.ok(results);
    } catch (error) {
      res.negotiate(error);
    }
  },
  sendOrderEmail: function(req, res) {
    var form = req.params.all();
    var orderId = form.id;
    Email.sendOrderConfirmation(orderId)
      .then(function() {
        res.ok();
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  find: function(req, res) {
    var form = req.params.all();
    var client = form.client;
    var model = 'order';
    var extraParams = {
      searchFields: ['folio', 'CardName', 'CardCode'],
      selectFields: form.fields,
      populateFields: ['Client', 'Broker'],
    };
    Common.find(model, form, extraParams)
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  async findById(req, res) {
    try {
      const { id } = req.allParams();
      const { Details } = await Order.findOne({ id }).populate('Details');
      await CancelationService.compareDetailsQuantity(Details);
      const orderFound = await Order.findOne({ id })
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
        .populate('OrderCancelations');
      const sapReferencesIds = orderFound.OrdersSap.map(({ id }) => id);
      const ordersSap = await OrderSap.find(sapReferencesIds)
        .populate('PaymentsSap')
        .populate('ProductSeries');
      const CancelationDetails =
        orderFound.OrderCancelations.length > 0
          ? await CancelationService.getCancelDetails(
              orderFound.OrderCancelations.map(({ id }) => id)
            )
          : [];
      let order = orderFound.toObject();
      order.OrdersSap = ordersSap;
      order.CancelationDetails = CancelationDetails;
      res.json(order);
    } catch (error) {
      res.negotiate(error);
    }
  },

  async findbyfilter(req, res) {
    try {
      const { page = 1, limit = 10, key, keyword } = req.allParams();
      const result = await Search.getOrdersToCancel(page, limit, key, keyword);
      res.ok(result);
    } catch (error) {
      res.negotiate(error);
    }
  },

  // findById: function(req, res) {
  //   var form = req.params.all();
  //   var id = form.id;
  //   var order;
  //   if (!isNaN(id)) {
  //     //id = parseInt(id);
  //   }
  //   Order.findOne({ id: id })
  //     .populate('Details')
  //     .populate('User')
  //     .populate('Client')
  //     .populate('Address')
  //     .populate('Payments')
  //     .populate('Store')
  //     .populate('EwalletRecords')
  //     .populate('Broker')
  //     .populate('OrdersSap')
  //     .populate('SapOrderConnectionLog')
  //     .populate('AlegraLogs')
  //     .then(function(foundOrder) {
  //       order = foundOrder.toObject();
  //       var sapReferencesIds = order.OrdersSap.map(function(ref) {
  //         return ref.id;
  //       });
  //       return OrderSap.find(sapReferencesIds)
  //         .populate('PaymentsSap')
  //         .populate('ProductSeries');
  //     })
  //     .then(function(ordersSap) {
  //       order.OrdersSap = ordersSap;
  //       res.json(order);
  //     })
  //     .catch(function(err) {
  //       console.log(err);
  //       res.negotiate(err);
  //     });
  // },

  getInvoicesLogs: function(req, res) {
    var form = req.params.all();
    var orderId = form.orderId;

    AlegraLog.find({ Order: orderId })
      .then(function(logs) {
        res.json(logs);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  async create(req, res) {
    try {
      const { quotationId, ewallet } = req.allParams();
      var responseSent = false;
      console.log('ORDER CREATE PARAMS: ', req.allParams());
      const orderCreated = await OrderService.create(
        quotationId,
        ewallet,
        req.user
      );
      //RESPONSE
      res.json(orderCreated);
      responseSent = true;
      const orderDetails = orderCreated.Details;

      //STARTS EMAIL SENDING PROCESS
      const order = await Order.findOne({ id: orderCreated.id })
        .populate('User')
        .populate('Client')
        .populate('Payments')
        .populate('EwalletRecords')
        .populate('Address');

      await Email.sendOrderConfirmation(order.id);
      await Email.sendFreesale(order.id);
      const invoice = await InvoiceService.createOrderInvoice(order.id);
      const syncProducts = await StockService.syncOrderDetailsProducts(
        orderDetails
      );

      console.log('Email de orden enviado: ' + order.folio);
      console.log('productsSynced', syncProducts);
      console.log('generated invoice', invoice);
    } catch (err) {
      console.log(err);
      if (!responseSent) {
        return res.negotiate(err);
      }
    }
  },

  async cancel(req, res) {
    try {
      const id = req.param('id');
      const details = req.param('details');
      const canceledOrder = await OrderService.cancel(id, details);
      return res.json(canceledOrder);
    } catch (err) {
      console.log('err', err);
      return res.negotiate(err);
    }
  },

  getCountByUser: function(req, res) {
    var form = req.params.all();
    OrderService.getCountByUser(form)
      .then(function(result) {
        res.json(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getTotalsByUser: function(req, res) {
    var form = req.params.all();
    OrderService.getTotalsByUser(form)
      .then(function(result) {
        res.json(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },
};

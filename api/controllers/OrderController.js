var _ = require('underscore');
var Promise = require('bluebird');
var BALANCE_SAP_TYPE = 'Balance';
var CLIENT_BALANCE_TYPE = 'client-balance';
var ERROR_SAP_TYPE = 'Error';
var EWALLET_POSITIVE = 'positive';
var INVOICE_SAP_TYPE = 'Invoice';
var ORDER_SAP_TYPE = 'Order';

module.exports = {
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

  findById: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    var order;
    if (!isNaN(id)) {
      //id = parseInt(id);
    }
    Order.findOne({ id: id })
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
      .then(function(foundOrder) {
        order = foundOrder.toObject();
        var sapReferencesIds = order.OrdersSap.map(function(ref) {
          return ref.id;
        });
        return OrderSap.find(sapReferencesIds)
          .populate('PaymentsSap')
          .populate('ProductSeries');
      })
      .then(function(ordersSap) {
        order.OrdersSap = ordersSap;
        res.json(order);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

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

  async createFromQuotation(req, res) {
    try {
      const orderCreated = await OrderService.createFromQuotation(
        req.allParams(),
        req.user
      );
      res.json(orderCreated);
      const order = await Order.findOne({ id: orderCreated.id })
        .populate('User')
        .populate('Client')
        .populate('Payments')
        .populate('EwalletRecords')
        .populate('Address')
        .populate('Details');
      const fiscalAddress = await FiscalAddress.findOne({
        CardCode: order.Client.CardCode,
        AdresType: ClientService.ADDRESS_TYPE,
      });
      // await Email.sendOrderConfirmation(order.id);
      await Email.sendFreesale(order.id);
      // console.log('order: ', order);
      // console.log('client: ', order.Client);
      // console.log('fiscalAddress: ', fiscalAddress);
      // console.log('payments: ', order.Payments);
      const invoice = await InvoiceService.createInvoice(
        order,
        order.Client,
        fiscalAddress,
        order.Payments,
        order.Details
      );
      // console.log('INVOICE MADAFACKA: ', invoice);
      const invoiceCreated = await Invoice.create({
        invoice_uid: invoice.Data.invoice_uid,
        order: order.id,
        folio: invoice.Data.INV.Folio,
      });
      await StockService.syncOrderDetailsProducts(orderDetails);
      console.log('Email de orden enviado: ' + order.folio);
      // console.log('productsSynced', productsSynced);
      console.log('generated invoice', invoiceCreated);
    } catch (err) {
      res.negotiate(err);
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

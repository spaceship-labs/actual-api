var _ = require('underscore');
var moment = require('moment');
var request = require('request-promise');
var Promise = require('bluebird');
var ALEGRAUSER = process.env.ALEGRAUSER;
var ALEGRATOKEN = process.env.ALEGRATOKEN;
var token = new Buffer(ALEGRAUSER + ":" + ALEGRATOKEN).toString('base64');
var alegraIVAID = 2;
var alegraACCOUNTID = 1;
var RFCPUBLIC = 'XAXX010101000';

module.exports = {
  create: create,
  send: send,
};

function create(orderId) {
  return Order
    .findOne(orderId)
    .populate('Client')
    .populate('Details')
    .populate('Payments')
    .then(function(order) {
      var client = order.Client;
      var details = order.Details.map(function(d) { return d.id; });
      var payments = order.Payments;
      return [
        order,
        payments,
        OrderDetail.find(details).populate('Product'),
        FiscalAddress.findOne({ CardCode: client.CardCode, AdresType: 'S' }),
        client,
      ];
    })
    .spread(function(order, payments, details, address, client) {
      return [
        order,
        preparePayments(payments),
        prepareClient(order, client, address),
        prepareItems(details)
      ];
    })
    .spread(function(order, payments, client, items) {
      return prepareInvoice(order, payments, client, items);
    });
}

function send(orderID) {
  return Order
    .findOne(orderID)
    .populate('Client')
    .then(function(order) {
      return [
        Invoice.findOne({ order: orderID }),
        FiscalAddress.findOne({ CardCode: order.Client.CardCode }),
      ];
    })
    .spread(function(invoice, address) {
      var emails = [];

      if(process.env.MODE === 'production'){
        emails = [
          'tugorez@gmail.com',
          'luisperez@spaceshiplabs.com',
          'informatica@actualg.com',
          address.E_Mail
        ];
      }else{
        emails = ['tugorez@gmail.com', 'luisperez@spaceshiplabs.com'];
      }

      var id = invoice.alegraId;
      return { id: id, emails: emails };
    })
    .then(function(data) {
      var options = {
        method: 'POST',
        uri: 'https://app.alegra.com/api/v1/invoices/' + data.id + '/email',
        body: data,
        headers: {
          Authorization: 'Basic ' + token,
        },
        json: true,
      };
      return request(options);
    });
}

function prepareInvoice(order, payments, client, items) {
  var date = moment(order.createdAt)
    .format('YYYY-MM-DD');
  var dueDate = moment(order.createdAt)
    .add(7, 'days')
    .format('YYYY-MM-DD');
  var data = {
    date: date,
    dueDate: dueDate,
    client: client,
    items: items,
    paymentMethod: 'other',
    anotation: order.folio,
    stamp: {
      generateStamp: true,
    },
    orderObject: order
  };
  return createInvoice(data);
}

function createInvoice(data) {
  var orderObject = _.clone(data.orderObject);
  delete data.orderObject;

  var options = {
    method: 'POST',
    uri: 'https://app.alegra.com/api/v1/invoices',
    body: data,
    headers: {
      Authorization: 'Basic ' + token,
    },
    json: true,
  };

  var log = {
    User: orderObject.User,
    Order: orderObject.id,
    Store: orderObject.Store,
    requestData: JSON.stringify(data),
    url: options.uri
  };

  var resultAlegra;
  var requestError;

  return new Promise(function(resolve, reject){

    AlegraLog.create(log)
      .then(function(logCreated){
        log.id = logCreated.id;
        return request(options);
      })
      .then(function(result){
        resultAlegra = result;
        return AlegraLog.update({id:log.id}, {responseData: JSON.stringify(result)});
      })
      .then(function(logUpdated){
        resolve(resultAlegra);
      })
      .catch(function(err){
        requestError = err;
        return AlegraLog.update({id:log.id}, {
          responseData: JSON.stringify(err),
          isError: true
        });

      })
      .then(function(logUpdated){
        reject(requestError);
      });

  });
}

function prepareClient(order, client, address) {
  var generic = !client.LicTradNum || client.LicTradNum == RFCPUBLIC;
  var data;
  if (!generic) {
    data = {
      name: address.companyName,
      identification: client.LicTradNum,
      email: address.E_Mail,
      address: {
        street: address.Street,
        exteriorNumber: address.U_NumExt,
        interiorNumber: address.U_NumInt,
        colony: address.Block,
        country: 'México',
        state: address.State,
        municipality:  address.U_Localidad,
        localitiy: address.City,
        zipCode: address.ZipCode,
      }
    };
  } else {
    data = {
      name: order.CardName,
      identification: RFCPUBLIC,
      email: order.E_Mail,
      address: {
        country: 'México',
        state: order.U_Estado || 'Quintana Roo',

        //TODO; Check default Inovice data for GENERAL PUBLIC
        //colony: order.U_Colonia,
        //street: 'entre calle ' + order.U_Entrecalle + ' y calle ' + order.U_Ycalle,
        //exteriorNumber: order.U_Noexterior,
        //interiorNumber: order.U_Nointerior,
        //municipality:  order.U_Mpio,
        //localitiy: order.U_Ciudad,
        //zipCode: order.U_CP,
      }
    };
  }
  return createClient(data);
}

function createClient(client) {
  var options = {
    method: 'POST',
    uri: 'https://app.alegra.com/api/v1/contacts',
    body: client,
    headers: {
      Authorization: 'Basic ' + token,
    },
    json: true,
  };
  return request(options);
}

function prepareItems(details) {
  var items = details.map(function(detail) {
    var discount = detail.discountPercent ? detail.discountPercent : 0;
    discount = Math.abs(discount);
    return {
      id: detail.id,
      name: detail.Product.ItemName,
      price: detail.unitPrice / 1.16,
      discount: discount,
      tax: [ {id: alegraIVAID} ],
      quantity: detail.quantity,
    };
  });
  return Promise.all(createItems(items));
}

function createItems(items) {
  return items.map(function(item) {
    var options = {
      method: 'POST',
      uri: 'https://app.alegra.com/api/v1/items',
      body: item,
      headers: {
        Authorization: 'Basic ' + token,
      },
      json: true,
    };
    return request(options).then(function(ic) {
      return _.assign({}, item, { id: ic.id});
    });
  });
}

function preparePayments(payments) {
  return payments.map(function(payment) {
    var date = moment(payment.createdAt)
      .format('YYYY-MM-DD');
    return {
      date: date,
      account: { id: alegraACCOUNTID },
      amount: payment.ammount,
      bankAccount: { id: 1 },
      type: 'in',
      paymentMethod: 'cash',
    };
  });
}


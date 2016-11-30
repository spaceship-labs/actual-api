var _ = require('underscore');
var moment = require('moment');
var request = require('request-promise');
var ALEGRAUSER = process.env.ALEGRAUSER;
var ALEGRATOKEN = process.env.ALEGRATOKEN;
var token = new Buffer(ALEGRAUSER + ":" + ALEGRATOKEN).toString('base64');

module.exports = {
  create: create,
}

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
        FiscalAddress.findOne({ CardCode: client.CardCode }),
      ];
    })
    .spread(function(order, payments, details, address) {
      return [
        order,
        prepareClient(address),
        prepareItems(details)
      ];
    })
    .spread(function(order, client, items) {
      return prepareInvoice(order, client, items);
    });
}

function prepareInvoice(order, client, items) {
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
    status: 'draft',
    paymentMethod: 'cash',
  };
  return createInvoice(data);
}

function createInvoice(data) {
  var options = {
    method: 'POST',
    uri: 'https://app.alegra.com/api/v1/invoices',
    body: data,
    headers: {
      Authorization: 'Basic ' + token,
    },
    json: true,
  };
  return request(options);
}

function prepareClient(address) {
  var client = {
    name: address.companyName,
    identification: address.rfc,
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
  return createClient(client);
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
    return {
      id: detail.id,
      name: detail.Product.ItemName,
      price: detail.unitPrice,
      quantity: detail.quantity,
      discount: detail.discountPercent,
      total: detail.total / 1.16,
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


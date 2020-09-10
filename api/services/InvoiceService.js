const _ = require('underscore');
const moment = require('moment');
const request = require('request-promise');
const Promise = require('bluebird');
const ALEGRAUSER = process.env.ALEGRAUSER;
const ALEGRATOKEN = process.env.ALEGRATOKEN;
const token = new Buffer(ALEGRAUSER + ':' + ALEGRATOKEN).toString('base64');
const promiseDelay = require('promise-delay');
const ALEGRA_IVA_ID = 2;
const RFCPUBLIC = 'XAXX010101000';
const DEFAULT_CFDI_USE = 'P01';

module.exports = {
  createOrderInvoice,
  send,
  getHighestPayment,
  getPaymentMethodBasedOnPayments,
  getAlegraPaymentType,
  prepareClient,
  prepareClientParams,
  getUnitTypeByProduct,
  RFCPUBLIC,
  DEFAULT_CFDI_USE,
  hasClientBalancePayment,
  hasClientCreditPayment,
};

function createOrderInvoice(orderId) {
  return new Promise(function(resolve, reject) {
    var orderFound;
    var errInvoice;

    if (process.env.MODE !== 'production') {
      resolve({});
      return;
    }

    Order.findOne(orderId)
      .populate('Client')
      .populate('Details')
      .populate('Payments')
      .then(function(order) {
        orderFound = order;

        if (OrderService.isCanceled(order)) {
          reject(
            new Error(
              'No es posible crear una factura ya que la orden esta cancelada'
            )
          );
          return;
        }

        var client = order.Client;
        var details = order.Details.map(function(d) {
          return d.id;
        });
        var payments = order.Payments;
        return [
          order,
          payments,
          OrderDetail.find(details).populate('Product'),
          FiscalAddress.findOne({
            CardCode: client.CardCode,
            AdresType: ClientService.ADDRESS_TYPE,
          }),
          client,
        ];
      })
      .spread(function(order, payments, details, address, client) {
        return [
          order,
          payments,
          prepareClient(order, client, address),
          prepareItems(details),
        ];
      })
      .spread(function(order, payments, client, items) {
        return prepareInvoice(order, payments, client, items);
      })
      .then(function(alegraInvoice) {
        resolve(Invoice.create({ alegraId: alegraInvoice.id, order: orderId }));
      })
      .catch(function(err) {
        errInvoice = err;

        var log = {
          User: orderFound ? orderFound.User : null,
          Order: orderId,
          Store: orderFound ? orderFound.Store : null,
          responseData: JSON.stringify(errInvoice),
          isError: true,
        };

        return AlegraLog.create(log);
      })
      .then(function(logCreated) {
        reject(errInvoice);
      });
  });
}

function send(orderID) {
  return Order.findOne(orderID)
    .populate('Client')
    .then(function(order) {
      return [
        Invoice.findOne({ order: orderID }),
        FiscalAddress.findOne({
          CardCode: order.Client.CardCode,
          AdresType: ClientService.ADDRESS_TYPE,
        }),
      ];
    })
    .spread(function(invoice, address) {
      var emails = [];
      sails.log.info('address', address.U_Correos);

      if (process.env.MODE === 'production') {
        emails = [
          address.U_Correos,
          'facturamiactual@actualstudio.com',
          'facturacion@actualg.com',
        ];
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
  var date = moment(order.createdAt).format('YYYY-MM-DD');
  var dueDate = moment(order.createdAt)
    .add(7, 'days')
    .format('YYYY-MM-DD');

  var data = {
    date: date,
    dueDate: dueDate,
    client: client,
    items: items,
    cfdiUse: client.cfdiUse,
    paymentMethod: getPaymentMethodBasedOnPayments(payments, order),
    anotation: order.folio,
    stamp: {
      generateStamp: true,
    },
    orderObject: order,
  };

  data.paymentType = getAlegraPaymentType(data.paymentMethod, payments, order);

  return createInvoice(data);
}

function hasClientBalancePayment(payments) {
  return payments.some(function(payment) {
    return payment.type === PaymentService.types.CLIENT_BALANCE;
  });
}

function hasClientCreditPayment(payments) {
  return payments.some(
    payment => payment.type === PaymentService.types.CLIENT_CREDIT
  );
}

function getAlegraPaymentType(alegraPaymentMethod, payments, order) {
  if (hasClientBalancePayment(payments) && !hasClientCreditPayment(payments)) {
    return 'PUE';
  } else if (
    alegraPaymentMethod === 'other' ||
    appliesForSpecialCashRule(payments, order)
  ) {
    return 'PPD';
  } else if (hasClientCreditPayment(payments)) {
    return 'PUE';
  }

  return 'PUE';
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
    url: options.uri,
  };

  var resultAlegra;
  var requestError;

  return new Promise(function(resolve, reject) {
    AlegraLog.create(log)
      .then(function(logCreated) {
        log.id = logCreated.id;
        return request(options);
      })
      .then(function(result) {
        resultAlegra = result;
        return AlegraLog.update(
          { id: log.id },
          { responseData: JSON.stringify(result) }
        );
      })
      .then(function(logUpdated) {
        resolve(resultAlegra);
      })
      .catch(function(err) {
        requestError = err;
        return AlegraLog.update(
          { id: log.id },
          {
            responseData: JSON.stringify(err),
            isError: true,
          }
        );
      })
      .then(function(logUpdated) {
        reject(requestError);
      });
  });
}

function getHighestPayment(payments) {
  var highest = payments.reduce(function(prev, current) {
    var prevAmount =
      prev.currency === PaymentService.currencyTypes.USD
        ? PaymentService.calculateUSDPayment(prev, prev.exchangeRate)
        : prev.ammount;

    var currentAmount =
      current.currency === PaymentService.currencyTypes.USD
        ? PaymentService.calculateUSDPayment(current, current.exchangeRate)
        : current.ammount;

    return prevAmount > currentAmount ? prev : current;
  });

  return highest;
}

function appliesForSpecialCashRule(payments, order) {
  //Rule 20th April 2018
  //When applying cash plus other payment method(except client balance or client credit)
  //If cash is the main payment method
  //and the total is 100k or above

  const INVOICE_AMOUNT_LIMIT_CONSTRAINT = 100000;

  if (payments.length > 1 && order.total >= INVOICE_AMOUNT_LIMIT_CONSTRAINT) {
    var highestPayment = getHighestPayment(payments);
    if (
      highestPayment.type === PaymentService.types.CASH ||
      highestPayment.type === PaymentService.types.CASH_USD
    ) {
      return true;
    }
  }
  return false;
}

//Excludes CLIENT BALANCE and CREDIT CLIENT payments
function getDirectPayments(payments) {
  return payments.filter(function(p) {
    return (
      p.type !== PaymentService.CLIENT_BALANCE_TYPE &&
      p.type !== PaymentService.types.CLIENT_CREDIT
    );
  });
}

function getPaymentMethodBasedOnPayments(payments, order) {
  var paymentMethod = 'other';
  var uniquePaymentMethod = payments[0];
  var directPayments = [];

  if (payments.length > 1) {
    //Taking the highest payment as main, except the
    //client-credit and client balance payment type
    directPayments = getDirectPayments(payments);

    if (directPayments.length === 0) {
      return 'other';
    }
    uniquePaymentMethod = getHighestPayment(directPayments);

    if (appliesForSpecialCashRule(payments, order)) {
      return 'other';
    }
  }

  switch (uniquePaymentMethod.type) {
    case 'cash':
    case 'cash-usd':
    case 'deposit':
      paymentMethod = 'cash';
      break;

    case 'transfer-usd':
    case 'transfer':
      paymentMethod = 'transfer';
      break;

    case 'ewallet':
      paymentMethod = 'electronic-wallet';
      break;

    case 'single-payment-terminal':
    case 'credit-card':
    case '3-msi':
    case '3-msi-banamex':
    case '6-msi':
    case '6-msi-banamex':
    case '9-msi':
    case '9-msi-banamex':
    case '12-msi':
    case '12-msi-banamex':
    case '13-msi':
    case '18-msi':
      paymentMethod = 'credit-card';
      break;

    case 'debit-card':
      paymentMethod = 'debit-card';
      break;

    case 'cheque':
      paymentMethod = 'check';
      break;

    case 'client-balance':
      //paymentMethod = 'other';
      paymentMethod = 'transfer';
      break;
    case 'client-credit':
      paymentMethod = 'other';
      break;
    default:
      paymentMethod = 'other';
      break;
  }

  return paymentMethod;
}

function prepareClientParams(order, client, address) {
  var generic =
    !client.LicTradNum || client.LicTradNum == FiscalAddressService.GENERIC_RFC;
  var data;

  if (order.folio === '013334') {
    data = {
      name: order.CardName,
      identification: 'XEXX010101000',
      cfdiUse: DEFAULT_CFDI_USE,
      email: 'natalieroe@intercorpgrp.com',
      address: {
        country: 'ESP',
        colony: address.Block,
        state: 'San José',
      },
    };
    return data;
  }

  if (!generic) {
    data = {
      name: address.companyName,
      identification: (client.LicTradNum || '').toUpperCase(),
      email: address.U_Correos,
      cfdiUse: client.cfdiUse || DEFAULT_CFDI_USE,
      address: {
        street: address.Street,
        exteriorNumber: address.U_NumExt,
        interiorNumber: address.U_NumInt,
        colony: address.Block,
        country: 'MEX',
        state: address.State,
        municipality: address.U_Localidad,
        localitiy: address.City,
        zipCode: address.ZipCode,
      },
    };
  } else {
    data = {
      name: order.CardName,
      identification: FiscalAddressService.GENERIC_RFC,
      cfdiUse: DEFAULT_CFDI_USE,
      //email: order.E_Mail,
      address: {
        country: 'MEX',
        state: order.U_Estado || 'Quintana Roo',
        //TODO; Check default Inovice data for GENERAL PUBLIC
      },
    };
  }
  return data;
}

function prepareClient(order, client, address) {
  const data = prepareClientParams(order, client, address);
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

function getUnitTypeByProduct(product) {
  if (product.Service === 'Y') {
    return 'service';
  }
  switch (product.U_ClaveUnidad) {
    case 'H87':
      return 'piece';
    case 'SET':
      return 'piece';
    case 'E48':
      return 'service';
    default:
      return 'piece';
  }
}

function prepareItems(details) {
  var items = details.map(function(detail) {
    var discount = detail.discountPercent ? detail.discountPercent : 0;
    discount = Math.abs(discount);
    if (discount < 1) {
      discount = parseFloat(discount.toFixed(4));
    }
    var product = detail.Product;
    const productKey =
      product.U_ClaveProdServ === 1010101
        ? '01010101'
        : product.U_ClaveProdServ;
    const alegraDesc = product.ItemCode + " " + product.ItemName;
    return {
      id: detail.id,
      name: product.ItemName,
      price: detail.unitPrice / 1.16,
      description: alegraDesc,
      //discount: discount,
      discount: parseFloat(discount.toFixed(4)),
      tax: [{ id: ALEGRA_IVA_ID }],
      productKey,
      quantity: detail.quantity,
      inventory: {
        unit: getUnitTypeByProduct(product),
        unitCost: detail.unitPrice,
        initialQuantity: detail.quantity,
      },
    };
  });

  return Promise.mapSeries(items, function(item) {
    return createItemWithDelay(item);
  });

  //Use to instant requests instead of delaying the requests
  //return Promise.all(createItems(items));
}

function createItemWithDelay(item) {
  var options = {
    method: 'POST',
    uri: 'https://app.alegra.com/api/v1/items',
    body: item,
    headers: {
      Authorization: 'Basic ' + token,
    },
    json: true,
  };
  return promiseDelay(600, request(options)).then(function(ic) {
    //console.log('item delayed ' + item.name, new Date());
    return _.assign({}, item, { id: ic.id });
  });
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
      return _.assign({}, item, { id: ic.id });
    });
  });
}

const _ = require('underscore');
const moment = require('moment');
const request = require('request-promise');
const Promise = require('bluebird');
const Facturapi = require('facturapi');
const facturapi = new Facturapi(process.env.FACTURAPITOKEN);

const ALEGRAUSER = process.env.ALEGRAUSER;
const ALEGRATOKEN = process.env.ALEGRATOKEN;
const token = new Buffer(ALEGRAUSER + ':' + ALEGRATOKEN).toString('base64');
const promiseDelay = require('promise-delay');
const ALEGRA_IVA_ID = 2;
const RFCPUBLIC = 'XAXX010101000';
const DEFAULT_CFDI_USE = 'P01';
const BigNumber = require('bignumber.js');

module.exports = {
  createOrderInvoice,
  createCreditNoteInvoice,
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
  getItemDiscount,
};

async function createOrderInvoice(orderId) {
  try {
    if (process.env.MODE !== 'production') {
      return;
    }
    var order = await Order.findOne(orderId)
      .populate('Client')
      .populate('Details')
      .populate('Payments');
    if (OrderService.isCanceled(order)) {
      throw new Error(
        'No es posible crear una factura ya que la orden esta cancelada'
      );
      return;
    }
    const { total, Client: clientOrder, Details, Payments: payments } = order;
    const detailsIds = Details.map(d => d.id);
    const details = await OrderDetail.find(detailsIds).populate('Product');
    const address = await FiscalAddress.findOne({
      CardCode: clientOrder.CardCode,
      AdresType: ClientService.ADDRESS_TYPE,
    });
    const client = await prepareClient(order, clientOrder, address);
    const ewalletDiscount = getEwalletDiscount(payments);
    const items = await prepareItems(details, ewalletDiscount, total);
    const alegraInvoice = await prepareInvoice(order, payments, client, items);
    await Invoice.create({ alegraId: alegraInvoice.id, order: orderId });
  } catch (err) {
    console.log(err);
    var log = {
      User: order ? order.User : null,
      Order: orderId,
      Store: order ? order.Store : null,
      responseData: JSON.stringify(err),
      isError: true,
    };

    await AlegraLog.create(log);
  }
}

function getEwalletDiscount(payments) {
  const totalDiscount =
    payments
      .map(({ type, ammount }) => {
        if (type === 'ewallet') {
          return ammount;
        } else {
          return 0;
        }
      })
      .reduce((paymentAmount, total) => paymentAmount + total, 0);
  const ewalletDiscount = new BigNumber(totalDiscount).toFixed(4);
  return new BigNumber(ewalletDiscount).toNumber();
}

function send(orderID) {
  return Order.findOne(orderID)
    .populate('Client')
    .then(function (order) {
      return [
        Invoice.findOne({ order: orderID }),
        FiscalAddress.findOne({
          CardCode: order.Client.CardCode,
          AdresType: ClientService.ADDRESS_TYPE,
        }),
      ];
    })
    .spread(function (invoice, address) {
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
    .then(function (data) {
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
  return payments.some(function (payment) {
    return payment.type === PaymentService.types.CLIENT_BALANCE;
  });
}

function getAlegraPaymentType(alegraPaymentMethod, payments, order) {
  if (hasClientBalancePayment(payments)) {
    return 'PUE';
  } else if (
    alegraPaymentMethod === 'other' ||
    appliesForSpecialCashRule(payments, order)
  ) {
    return 'PPD';
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

  return new Promise(function (resolve, reject) {
    AlegraLog.create(log)
      .then(function (logCreated) {
        log.id = logCreated.id;
        return request(options);
      })
      .then(function (result) {
        resultAlegra = result;
        return AlegraLog.update(
          { id: log.id },
          { responseData: JSON.stringify(result) }
        );
      })
      .then(function (logUpdated) {
        resolve(resultAlegra);
      })
      .catch(function (err) {
        requestError = err;
        return AlegraLog.update(
          { id: log.id },
          {
            responseData: JSON.stringify(err),
            isError: true,
          }
        );
      })
      .then(function (logUpdated) {
        reject(requestError);
      });
  });
}

function getHighestPayment(payments) {
  var highest = payments.reduce(function (prev, current) {
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
  return payments.filter(function (p) {
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
        country: client.CardCode === 'PL10003936' ? 'MEX' : 'México',
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
        country: 'México',
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

function getItemDiscount(ewalletDiscount, orderTotal, detailTotal, subtotal) {
  const detailAmount = new BigNumber(detailTotal);
  const ewalletAmount = new BigNumber(ewalletDiscount);
  const orderAmount = new BigNumber(orderTotal);
  const unitPrice = new BigNumber(subtotal);
  const detailDiscount = detailAmount.dividedBy(orderAmount).toFixed(6);
  const discountAmount = ewalletAmount.multipliedBy(detailDiscount).toFixed(4);
  const detailAmountDiscount = unitPrice.minus(detailAmount);
  const discount = new BigNumber(discountAmount)
    .plus(detailAmountDiscount)
    .toFixed(4);
  let discountPercent = new BigNumber(discount)
    .dividedBy(unitPrice)
    .multipliedBy(100)
    .toFixed(4);
  discountPercent = new BigNumber(discountPercent).toNumber();
  return discountPercent;
}

function prepareItems(details, ewalletDiscount, orderTotal) {
  var items = details.map(function (detail) {
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

    discount =
      ewalletDiscount > 0
        ? getItemDiscount(
          ewalletDiscount,
          orderTotal,
          detail.total,
          detail.subtotal
        )
        : parseFloat(discount.toFixed(4));
    return {
      id: detail.id,
      name: product.ItemName,
      price: detail.unitPrice / 1.16,
      discount,
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

  return Promise.mapSeries(items, function (item) {
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
  return promiseDelay(600, request(options)).then(function (ic) {
    //console.log('item delayed ' + item.name, new Date());
    return _.assign({}, item, { id: ic.id });
  });
}

function createItems(items) {
  return items.map(function (item) {
    var options = {
      method: 'POST',
      uri: 'https://app.alegra.com/api/v1/items',
      body: item,
      headers: {
        Authorization: 'Basic ' + token,
      },
      json: true,
    };
    return request(options).then(function (ic) {
      return _.assign({}, item, { id: ic.id });
    });
  });
}

// function createOrderInvoice(orderId) {
//   return new Promise(function(resolve, reject) {
//     var orderFound;
//     var errInvoice;
//     if (process.env.MODE !== 'production') {
//       resolve({});
//       return;
//     }
//     Order.findOne(orderId)
//       .populate('Client')
//       .populate('Details')
//       .populate('Payments')
//       .then(function(order) {
//         orderFound = order;
//         if (OrderService.isCanceled(order)) {
//           reject(
//             new Error(
//               'No es posible crear una factura ya que la orden esta cancelada'
//             )
//           );
//           return;
//         }
//         var client = order.Client;
//         var details = order.Details.map(function(d) {
//           return d.id;
//         });
//         var payments = order.Payments;
//         return [
//           order,
//           payments,
//           OrderDetail.find(details).populate('Product'),
//           FiscalAddress.findOne({
//             CardCode: client.CardCode,
//             AdresType: ClientService.ADDRESS_TYPE,
//           }),
//           client,
//         ];
//       })
//       .spread(function(order, payments, details, address, client) {
//         return [
//           order,
//           payments,
//           prepareClient(order, client, address),
//           prepareItems(details),
//         ];
//       })
//       .spread(function(order, payments, client, items) {
//         return prepareInvoice(order, payments, client, items);
//       })
//       .then(function(alegraInvoice) {
//         resolve(Invoice.create({ alegraId: alegraInvoice.id, order: orderId }));
//       })
//       .catch(function(err) {
//         errInvoice = err;
//         var log = {
//           User: orderFound ? orderFound.User : null,
//           Order: orderId,
//           Store: orderFound ? orderFound.Store : null,
//           responseData: JSON.stringify(errInvoice),
//           isError: true,
//         };
//         return AlegraLog.create(log);
//       })
//       .then(function(logCreated) {
//         reject(errInvoice);
//       });
//   });
// }

function getFacturapiPaymentMethod(method) {
  switch (method) {
    case 'cash':
      return Facturapi.PaymentForm.EFECTIVO;
    case 'electronic-wallet':
      return Facturapi.PaymentForm.MONEDERO_ELECTRONICO;
    case 'credit-card':
      return Facturapi.PaymentForm.TARJETA_DE_CREDITO;
    case 'debit-card':
      return Facturapi.PaymentForm.TARJETA_DE_DEBITO;
    case 'check':
      return Facturapi.PaymentForm.CHEQUE_NOMINATIVO;
    case 'transfer':
      return Facturapi.PaymentForm.TRANSFERENCIA_ELECTRONICA;
    default:
      return Facturapi.PaymentForm.POR_DEFINIR;
  }
}


/** Credit note */
async function createCreditNoteInvoice(orderId) {
  try {
    //if (process.env.MODE !== 'production') {
    //  return;
    //}
    const { alegraId: paymentInvoice } = await Invoice.findOne({ order: orderID });
    if (!paymentInvoice) {
      //throw new Error(
      //  'No es posible crear una nota de crédito ya que la orden no cuenta con una factura activa'
      //);
      sails.log.info("No se puede crear una nota de crédito de una orden sin facturar");
      return;
    }
    const { uuid: relatedInvoice } = await getAlegraInvoiceUUID(paymentInvoice);
    var order = await Order.findOne(orderId)
      .populate('Client')
      .populate('Details')
      .populate('Payments');
    const { total, Client: clientOrder, Details, Payments: payments } = order;
    const detailsIds = Details.map(d => d.id);
    const details = await OrderDetail.find(detailsIds).populate('Product');
    const address = await FiscalAddress.findOne({
      CardCode: clientOrder.CardCode,
      AdresType: ClientService.ADDRESS_TYPE,
    });
    const client = await prepareClientFacturapi(order, clientOrder, address);
    const ewalletDiscount = getEwalletDiscount(payments);
    const generalItemsConcept = prepareCreditNoteItems(details, ewalletDiscount, total);
    const facturapiInvoice = prepareCreditNote(order, payments, client, generalItemsConcept, relatedInvoice);
    await Invoice.update({id:paymentInvoice},{ facturapiId: facturapiInvoice.id, order: orderId });

  } catch (err) {
    var log = {
      User: order ? order.User : null,
      Order: orderId,
      Store: order ? order.Store : null,
      responseData: JSON.stringify(err),
      isError: true,
    };

    await AlegraLog.create(log);
  }
}
/**
 * Get alegra invoice uuid
*/
async function getAlegraInvoiceUUID(paymentInvoice) {
  var options = {
    method: 'GET',
    uri: 'https://app.alegra.com/api/v1/invoices/' + paymentInvoice,
    headers: {
      Authorization: 'Basic ' + token,
    },
    json: true,
  };
  return request(options).then(function (invoice) {
    return invoice.stamp;
  });
}
/**
 * Get facturapi invoice uuid
*/
async function getInvoiceUUID(paymentInvoice) {
  const invoice = await facturapi.invoices.retrieve(paymentInvoice);
  if (!invoice) {
    return getAlegraInvoiceUUID(paymentInvoice);
  }
  return invoice;
}
function prepareCreditNoteItems(details, ewalletDiscount, orderTotal) {
  var items = details.map(function (detail) {
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

    discount =
      ewalletDiscount > 0
        ? getItemDiscount(
          ewalletDiscount,
          orderTotal,
          detail.total,
          detail.subtotal
        )
        : parseFloat(discount.toFixed(4));
    const quantity = detail.quantityCanceled;

    return {
      sku: detail.id,
      description: product.ItemName,
      price: detail.unitPrice / 1.16,
      discount,
      tax_included: false,
      taxes: [{
        withholding: false,
        type: "IVA",
        rate: 0.16
      }],
      product_key: productKey,
      quantity,
      unit_key: product.U_ClaveUnidad,
      unit_name: getUnitTypeByProduct(product),
      ItemCode: product.ItemCode,
      //inventory: {
      //  unit: getUnitTypeByProduct(product),
      //  unitCost: detail.unitPrice,
      //  initialQuantity: detail.quantity,
      //},
    };
  });

  const CreditNoteConcept = items.reduce(function (accum, item) {
    accum.price += ((item.price*1.16) * item.quantity);

    if (item.quantity > 0) {
      accum.description += item.ItemCode + " | ";
    }
    return accum;
  }, {
    price: 0,
    description: "Devolución / Cancelación de los siguientes artículos: ",
  });

  return CreditNoteConcept;
  //return Promise.mapSeries(items, function (item) {
  //  return createItemWithDelay(item);
  //});

  //Use to instant requests instead of delaying the requests
  //return Promise.all(createItems(items));
}

function prepareCreditNote(order, payments, client, generalItemsConcept, relatedInvoice) {
  var date = moment(order.createdAt).format('YYYY-MM-DD');
  var dueDate = moment(order.createdAt)
    .add(7, 'days')
    .format('YYYY-MM-DD');
  var data = {
    //date: date,
    //dueDate: dueDate,
    type: Facturapi.InvoiceType.EGRESO,
    customer: client,
    product: generalItemsConcept,
    use: client.cfdiUse,
    relation: Facturapi.InvoiceRelation.NOTA_DE_CREDITO,
    related: [relatedInvoice],
    payment_form: Facturapi.PaymentForm.DINERO_ELECTRONICO, //getFacturapiPaymentMethod(getPaymentMethodBasedOnPayments(payments, order)),
    folio_number: order.folio,
    stamp: {
      generateStamp: true,
    },
    orderObject: order,
  };

  data.payment_method = getAlegraPaymentType(data.payment_form, payments, order);

  return createInvoiceFacturapi(data);
}

/*** facturapi */
function prepareClientParamsFacturapi(order, client, address) {
  var generic =
    !client.LicTradNum || client.LicTradNum == FiscalAddressService.GENERIC_RFC;
  var data;

  if (order.folio === '013334') {
    data = {
      legal_name: order.CardName,
      tax_id: 'XEXX010101000',
      cfdiUse: DEFAULT_CFDI_USE,
      email: 'natalieroe@intercorpgrp.com',
      address: {
        country: 'ESP',
        neighborhood: address.Block,
        state: 'San José',
      },
    };
    return data;
  }

  if (!generic) {
    data = {
      legal_name: address.companyName,
      tax_id: (client.LicTradNum || '').toUpperCase(),
      email: address.U_Correos,
      cfdiUse: client.cfdiUse || DEFAULT_CFDI_USE,
      address: {
        street: address.Street,
        exterior: address.U_NumExt,
        interior: address.U_NumInt,
        neighborhood: address.Block,
        country: client.CardCode === 'PL10003936' ? 'MEX' : 'México',
        state: address.State,
        municipality: address.U_Localidad,
        city: address.City,
        zip: address.ZipCode,
      },
    };
  } else {
    data = {
      legal_name: order.CardName,
      tax_id: FiscalAddressService.GENERIC_RFC,
      cfdiUse: DEFAULT_CFDI_USE,
      //email: order.E_Mail,
      address: {
        country: 'México',
        state: order.U_Estado || 'Quintana Roo',
        //TODO; Check default Inovice data for GENERAL PUBLIC
      },
    };
  }
  return data;
}

async function prepareClientFacturapi(order, client, address) {
  const data = prepareClientParamsFacturapi(order, client, address);
  return await createClientFacturapi(data);
}

async function createClientFacturapi(client) {
  //var options = {
  //  method: 'POST',
  //  uri: 'https://app.alegra.com/api/v1/contacts',
  //  body: client,
  //  headers: {
  //    Authorization: 'Basic ' + token,
  //  },
  //  json: true,
  //};
  return await facturapi.customers.create(client);
}

function createInvoiceFacturapi(data) {
  console.log('invoice data', data);
  var orderObject = _.clone(data.orderObject);
  delete data.orderObject;
  var options = {
    //method: 'POST',
    uri: 'https://facturapi.io/v1/invoices',
    //body: data,
    //headers: {
    //  Authorization: 'Basic ' + token,
    //},
    //json: true,
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

  return new Promise(function (resolve, reject) {
    AlegraLog.create(log)
      .then(function (logCreated) {
        log.id = logCreated.id;
        return facturapi.invoices.create(data);
      })
      .then(function (result) {
        resultAlegra = result;
        return AlegraLog.update(
          { id: log.id },
          { responseData: JSON.stringify(result) }
        );
      })
      .then(function (logUpdated) {
        resolve(resultAlegra);
      })
      .catch(function (err) {
        requestError = err;
        return AlegraLog.update(
          { id: log.id },
          {
            responseData: JSON.stringify(err),
            isError: true,
          }
        );
      })
      .then(function (logUpdated) {
        reject(requestError);
      });
  });
}

function getFacturapiPaymentType(alegraPaymentMethod, payments, order) {
  if (hasClientBalancePayment(payments)) {
    return Facturapi.PaymentMethod.PAGO_EN_UNA_EXHIBICION;
  } else if (
    alegraPaymentMethod === Facturapi.PaymentForm.POR_DEFINIR ||
    appliesForSpecialCashRule(payments, order)
  ) {
    return Facturapi.PaymentMethod.PAGO_EN_PARCIALIDADES_DIFERIDO;
  }
  return Facturapi.PaymentMethod.PAGO_EN_UNA_EXHIBICION;
}
function createInvoiceFacturapi(data) {
  console.log('invoice data', data);
  var orderObject = _.clone(data.orderObject);
  delete data.orderObject;
  var options = {
    //method: 'POST',
    uri: 'https://facturapi.io/v1/invoices',
    //body: data,
    //headers: {
    //  Authorization: 'Basic ' + token,
    //},
    //json: true,
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

  return new Promise(function (resolve, reject) {
    AlegraLog.create(log)
      .then(function (logCreated) {
        log.id = logCreated.id;
        return facturapi.invoices.create(data);
      })
      .then(function (result) {
        resultAlegra = result;
        return AlegraLog.update(
          { id: log.id },
          { responseData: JSON.stringify(result) }
        );
      })
      .then(function (logUpdated) {
        resolve(resultAlegra);
      })
      .catch(function (err) {
        requestError = err;
        return AlegraLog.update(
          { id: log.id },
          {
            responseData: JSON.stringify(err),
            isError: true,
          }
        );
      })
      .then(function (logUpdated) {
        reject(requestError);
      });
  });
}


function sendFacturapi(orderID) {
  return Order.findOne(orderID)
    .populate('Client')
    .then(function (order) {
      return [
        Invoice.findOne({ order: orderID }),
        FiscalAddress.findOne({
          CardCode: order.Client.CardCode,
          AdresType: ClientService.ADDRESS_TYPE,
        }),
      ];
    })
    .spread(function (invoice, address) {
      var emails = [];
      sails.log.info('address', address.U_Correos);

      if (process.env.MODE === 'production') {
        emails = [
          address.U_Correos,
          'facturamiactual@actualstudio.com',
          'facturacion@actualg.com',
        ];
      }

      var id = invoice.facturapiId;
      return { id: id, emails: emails };
    })
    .then(function (data) {
      return facturapi.invoices.sendByEmail(data.id, { email: "sergiocan@spaceshiplabs.com" });
    });
}
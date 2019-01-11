const baseUrl = process.env.SAP_URL; //'http://sapnueve.homedns.org:8080'
//var baseUrl = 'http://189.149.131.100:8080';
const request = require('request-promise');
const qs = require('qs');
const Promise = require('bluebird');
const buildUrl = require('build-url');
const _ = require('underscore');
const moment = require('moment');
const axios = require('axios');
const API_BASE = 'sapnueve.homedns.org';
axios.defaults.baseURL = API_BASE;

const SAP_DATE_FORMAT = 'YYYY-MM-DD';
const CLIENT_CARD_TYPE = 1; //1.Client, 2.Proveedor, 3.Lead
const CREATE_CONTACT_ACTION = 0;
const UPDATE_CONTACT_ACTION = 1;

const COMPANY_STUDIO_CODE = '001';
const COMPANY_HOME_CODE = '002';
const COMPANY_BOTH_CODE = '003';
const COMPANY_KIDS_CODE = '004';

const STUDIO_GROUP = 'studio';
const HOME_GROUP = 'home';
const KIDS_GROUP = 'kids';
const PROJECTS_GROUP = 'proyectos';

const SUBJECTS = ['Cancelación mayor a 36 horas'];
const MESSAGES = ['Cancelación solicitada por el cliente'];
const USER_CODE_ADMINISTRADOR = 1;
const USER_CODE_CONTABILIDAD = 2;
const USER_CODE_COMPRAS = 3;

var reqOptions = {
  method: 'POST',
  json: true,
};

const throwAlert = async ({ subject, message, userCode }) => {
  let params = {
    subject: SUBJECTS[subject],
    message: MESSAGES[message],
    userCode:
      userCode === 1
        ? USER_CODE_ADMINISTRADOR
        : userCode === 2 ? USER_CODE_CONTABILIDAD : USER_CODE_COMPRAS,
  };
  const { value } = await axios.post('/Notification', params);
  params.notificationID = value;
  const alert = await Alert.create(params);
  return alert;
};

const formatCancelParams = async id => {
  const { Quotation: IdQuotation, Details } = await Order.findOne({
    id,
  }).populate('Details');
};

const cancelOrder = async orderId => {
  console.log('ENTRA');
  await formatCancelParams(orderId);
  return 1;
  // return axios.delete('/SalesOrder', { IdQuotation, Product });
};

module.exports = {
  createContact: createContact,
  createSaleOrder: createSaleOrder,
  createClient: createClient,
  updateClient: updateClient,
  updateContact: updateContact,
  updateFiscalAddress: updateFiscalAddress,
  buildOrderRequestParams: buildOrderRequestParams,
  cancelOrder,
  throwAlert,
  formatCancelParams,
};

function createClient(params) {
  var path = 'Contact';
  var client = params.client;
  var fiscalAddress = params.fiscalAddress || {};
  var clientContacts = params.clientContacts || [];
  delete client.Currency;

  client.LicTradNum = client.LicTradNum || 'XAXX010101000';

  return User.findOne({ id: client.User })
    .populate('Seller')
    .then(function(user) {
      client.SlpCode = -1; //Assigns seller code from SAP
      if (user.Seller) {
        client.SlpCode = user.Seller.SlpCode || -1;
      }
      return getSeriesNum(user.activeStore);
    })
    .then(function(seriesNum) {
      client.Series = seriesNum; //Assigns seriesNum number depending on activeStore
      var requestParams = {
        Client: encodeURIComponent(JSON.stringify(client)),
        address: encodeURIComponent(JSON.stringify(fiscalAddress)),
        person: encodeURIComponent(JSON.stringify(clientContacts)),
      };
      var endPoint = buildUrl(baseUrl, {
        path: path,
        queryParams: requestParams,
      });
      sails.log.info('createClient');
      sails.log.info(decodeURIComponent(endPoint));
      reqOptions.uri = endPoint;
      return request(reqOptions);
    });
}

function updateClient(cardcode, form) {
  form = _.omit(form, _.isUndefined);

  //Important: DONT UPDATE BALANCE IN SAP
  delete form.Balance;
  delete form.Currency;

  var path = 'Contact';
  var params = {
    Client: encodeURIComponent(JSON.stringify(form)),
  };
  var endPoint = buildUrl(baseUrl, {
    path: path,
    queryParams: params,
  });
  sails.log.info('updateClient');
  sails.log.info(decodeURIComponent(endPoint));
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

function createContact(cardCode, form) {
  var path = 'PersonContact';
  form = _.omit(form, _.isUndefined);
  form.CardCode = cardCode;
  form.action = CREATE_CONTACT_ACTION;
  var params = {
    contact: encodeURIComponent(JSON.stringify({ CardCode: cardCode })),
    person: encodeURIComponent(JSON.stringify([form])),
  };
  var endPoint = buildUrl(baseUrl, {
    path: path,
    queryParams: params,
  });
  sails.log.info('createContact');
  sails.log.info(decodeURIComponent(endPoint));
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

function updateContact(cardCode, contactIndex, form) {
  var path = 'PersonContact';
  form = _.omit(form, _.isUndefined);
  form.Line = contactIndex;
  form.action = UPDATE_CONTACT_ACTION;
  var params = {
    contact: encodeURIComponent(JSON.stringify({ CardCode: cardCode })),
    person: encodeURIComponent(JSON.stringify([form])),
  };
  var endPoint = buildUrl(baseUrl, {
    path: path,
    queryParams: params,
  });
  sails.log.info('updateContact');
  sails.log.info(decodeURIComponent(endPoint));
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

function updateFiscalAddress(cardcode, form) {
  form.Address = form.companyName;
  var endPoint = buildAddressContactEndpoint(form, cardcode);
  sails.log.info('updateFiscalAddress');
  sails.log.info(decodeURIComponent(endPoint));
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

/*
  @param params object properties
    quotationId,
    groupCode,
    cardCode,
    slpCode,
    cntctCode,
    quotationDetails, //Populated with products
    payments,
    exchangeRate,
    currentStore
*/
function createSaleOrder(params) {
  var endPoint;
  var requestParams;
  return buildOrderRequestParams(params)
    .then(function(_requestParams) {
      requestParams = _requestParams;
      endPoint = baseUrl + '/SalesOrder';
      sails.log.info('createSaleOrder', endPoint);
      sails.log.info('requestParams', JSON.stringify(requestParams));
      const preForm = {
        contact: JSON.stringify(requestParams.contact),
        products: JSON.stringify(requestParams.products),
        payments: JSON.stringify(requestParams.payments),
      };
      const formDataStr = qs.stringify(preForm, { encode: true });
      var options = {
        json: true,
        method: 'POST',
        url: endPoint,
        body: formDataStr,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        },
      };
      return request(options);
    })
    .then(function(response) {
      return {
        requestParams,
        endPoint: endPoint,
        response: response,
      };
    });
}

function buildOrderRequestParams(params) {
  var products = [];
  var ACTUAL_PUERTO_CANCUN_GROUPCODE = 10;
  var ACTUAL_HOME_XCARET_GROUPCODE = 8;
  var PROJECTS_GROUPCODE = 6;
  var ACTUAL_STUDIO_CUMBRES_GROUPCODE = 4;
  var ACTUAL_STUDIO_MALECON_GROUPCODE = 1;
  var ACTUAL_STUDIO_PLAYA_GROUPCODE = 2;
  var ACTUAL_STUDIO_MERIDA_GROUPCODE = 3;
  var MARKETPLACES_GROUPCODE = 11;
  var MERCADOLIBRE_MARKETPLACE_GROUPCODE = 12;
  var AMAZON_MARKETPLACE_GROUPCODE = 13;

  if (
    params.groupCode != ACTUAL_HOME_XCARET_GROUPCODE &&
    params.groupCode != ACTUAL_PUERTO_CANCUN_GROUPCODE &&
    params.groupCode != PROJECTS_GROUPCODE &&
    params.groupCode != ACTUAL_STUDIO_CUMBRES_GROUPCODE &&
    params.groupCode != ACTUAL_STUDIO_MALECON_GROUPCODE &&
    params.groupCode != ACTUAL_STUDIO_PLAYA_GROUPCODE &&
    params.groupCode != ACTUAL_STUDIO_MERIDA_GROUPCODE &&
    params.groupCode != MARKETPLACES_GROUPCODE &&
    params.groupCode != MERCADOLIBRE_MARKETPLACE_GROUPCODE &&
    params.groupCode != AMAZON_MARKETPLACE_GROUPCODE &&
    process.env.MODE === 'production'
  ) {
    return Promise.reject(
      new Error('La creación de pedidos para esta tienda esta deshabilitada')
    );
  }

  var contactParams = {
    QuotationId: params.quotationId,
    GroupCode: params.groupCode,
    ContactPersonCode: params.cntctCode,
    Currency: 'MXP',
    ShipDate: moment(getFarthestShipDate(params.quotationDetails)).format(
      SAP_DATE_FORMAT
    ),
    SalesPersonCode: params.slpCode || -1,
    CardCode: params.cardCode,
    DescuentoPDocumento: calculateUsedEwalletByPayments(params.payments),
    Group: params.currentStore.group,
    Broker: params.brokerCode,
  };

  if (contactParams.SalesPersonCode === []) {
    contactParams.SalesPersonCode = -1;
  }

  return getAllWarehouses().then(function(warehouses) {
    products = params.quotationDetails.map(function(detail) {
      var product = {
        ItemCode: detail.Product.ItemCode,
        OpenCreQty: detail.quantity,
        WhsCode: getWhsCodeById(detail.shipCompanyFrom, warehouses),
        ShipDate: moment(detail.shipDate).format(SAP_DATE_FORMAT),
        DiscountPercent: detail.discountPercent,
        Company: getCompanyCode(
          detail.Product.U_Empresa,
          params.currentStore.group
        ),
        Price: detail.total,
        Service: detail.Product.Service, //FOR SR SERVICES
        ImmediateDelivery: Shipping.isDateImmediateDelivery(
          detail.shipDate,
          detail.immediateDelivery
        ),
        DetailId: detail.id,
        //unitPrice: detail.Product.Price
      };
      return product;
    });

    contactParams.WhsCode = getWhsCodeById(
      params.currentStore.Warehouse,
      warehouses
    );

    return {
      products,
      contact: contactParams,
      payments: mapPaymentsToSap(
        params.payments,
        params.exchangeRate,
        params.currentStore
      ),
    };
  });
}

function getCompanyCode(code, storeGroup) {
  var companyCode = code;
  if (companyCode === COMPANY_BOTH_CODE || !companyCode) {
    switch (storeGroup) {
      case STUDIO_GROUP:
        companyCode = COMPANY_STUDIO_CODE;
        break;
      case HOME_GROUP:
        companyCode = COMPANY_HOME_CODE;
        break;
      case PROJECTS_GROUP:
        companyCode = COMPANY_HOME_CODE;
        break;
    }
  }
  return companyCode;
}

function mapPaymentsToSap(payments, exchangeRate, currentStore) {
  console.log('currentStore', currentStore);
  payments = payments.filter(function(payment) {
    return (
      payment.type !== PaymentService.CLIENT_BALANCE_TYPE &&
      payment.type !== PaymentService.types.CLIENT_CREDIT &&
      payment.type !== PaymentService.EWALLET_TYPE &&
      !PaymentService.isCanceled(payment)
    );
  });

  var paymentsTopSap = payments.map(function(payment) {
    var DEFAULT_TERMINAL = 'banamex';
    var paymentSap = {
      TypePay: payment.type,
      PaymentAppId: payment.id,
      amount: payment.ammount,
    };

    if (
      currentStore.marketplace &&
      payment.type === PaymentService.types.TRANSFER
    ) {
      paymentSap.TypePay = PaymentService.types.TRANSFER_ECOMMERCE;
    }

    if (payment.currency === 'usd') {
      paymentSap.rate = exchangeRate;
    }
    if (PaymentService.isCardPayment(payment)) {
      paymentSap.CardNum = '4802';
      paymentSap.CardDate = '05/16'; //MM/YY
      /*
      if(!payment.terminal){
        payment.terminal = DEFAULT_TERMINAL;
      }
      */
    }
    if (payment.terminal) {
      paymentSap.Terminal = payment.terminal;
      paymentSap.DateTerminal = moment().format(SAP_DATE_FORMAT);
      paymentSap.ReferenceTerminal = payment.verificationCode;
    }

    return paymentSap;
  });

  return paymentsTopSap;
}

function getWhsCodeById(whsId, warehouses) {
  var warehouse = _.findWhere(warehouses, { id: whsId });
  if (warehouse) {
    return warehouse.WhsCode;
  }
  return false;
}

function getFarthestShipDate(quotationDetails) {
  var farthestShipDate = false;
  for (var i = 0; i < quotationDetails.length; i++) {
    if (
      (farthestShipDate &&
        new Date(quotationDetails[i].shipDate) >= farthestShipDate) ||
      i === 0
    ) {
      farthestShipDate = quotationDetails[i].shipDate;
    }
  }
  return farthestShipDate;
}

function calculateUsedEwalletByPayments(payments) {
  var ewallet = 0;
  ewallet = payments.reduce(function(amount, payment) {
    if (payment.type === PaymentService.EWALLET_TYPE) {
      amount += payment.ammount;
    }
    return amount;
  }, 0);
  return ewallet;
}

function getAllWarehouses() {
  return Company.find({});
}

function getSeriesNum(storeId) {
  return Store.findOne({ id: storeId })
    .populate('Warehouse')
    .then(function(store) {
      return mapWhsSeries(store.Warehouse.WhsName);
    })
    .catch(function(err) {
      console.log(err);
      return err;
    });
}

function mapWhsSeries(whsName) {
  var series = 209;
  switch (whsName) {
    case 'STUDIO MALECON':
      series = 182;
      break;
    case 'STUDIO PLAYA':
      series = 183;
      break;
    case 'STUDIO CUMBRES':
      series = 185;
      break;
    case 'STUDIO CARMEN':
      series = 181;
      break;
    case 'STUDIO MERIDA':
      series = 184;
      break;
    case 'STUDIO CHETUMAL':
      series = 186;
      break;
    case 'HOME XCARET':
      series = 209;
      break;
    case 'HOME PUERTO CANCUN':
      series = 186;
      break;
    case 'HOME MERIDA':
      series = 210;
      break;
    default:
      series = 209;
      break;
  }

  return series;
}

function buildAddressContactEndpoint(fields, cardcode) {
  var path = '/AddressContact';
  var contact = {
    CardCode: cardcode,
    U_Correos: fields.U_Correos,
    LicTradNum: fields.LicTradNum,
  };
  field = _.omit(fields, _.isUndefined);
  path += '?address=' + encodeURIComponent(JSON.stringify(fields));
  path += '&contact=' + encodeURIComponent(JSON.stringify(contact));
  return baseUrl + path;
}

// function cancelOrder(quotationId) {
//   const requestParams = {
//     QuotationId: quotationId,
//   };
//   const endPoint = buildUrl(baseUrl, {
//     path: 'SalesOrder',
//     queryParams: requestParams,
//   });
//   sails.log.info('cancel order');
//   sails.log.info(decodeURIComponent(endPoint));
//   reqOptions.uri = endPoint;
//   reqOptions.method = 'DELETE';
//   return request(reqOptions);
// }

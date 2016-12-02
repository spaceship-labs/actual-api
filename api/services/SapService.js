var baseUrl = 'http://sapnueve.homedns.org:8080';
var request = require('request-promise');
var Promise = require('bluebird');
var buildUrl = require('build-url');
var _ = require('underscore');
var moment = require('moment');
var SAP_DATE_FORMAT = 'YYYY-MM-DD';

var reqOptions = {
  method: 'POST',
  json: true
};

module.exports = {
  createClient        : createClient,
  createContact       : createContact,
  createSaleOrder     : createSaleOrder,
  createFiscalAddress : createFiscalAddress,
  buildSaleOrderRequestParams: buildSaleOrderRequestParams,
  updateClient        : updateClient,
  updateContact       : updateContact,
  updateFiscalAddress : updateFiscalAddress
};

function updateClient(cardcode, form){
  form = _.omit(form, _.isUndefined);
  var path = 'Contact(\'' + cardcode + '\')';
  var endPoint = buildUrl(baseUrl, {
    path: path,
    queryParams: form
  });
  sails.log.info('updateClient');
  sails.log.info(endPoint);
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

function createClient(form){
  var path = 'Contact';
  form.CardType = 1; //1.Client, 2.Proveedor, 3.Lead
  form.LicTradNum = form.LicTradNum || 'XXAX010101000';
  return User.findOne({id:form.User}).populate('Seller')
    .then(function(user){
      form.SlpCode = -1;//Assigns seller code from SAP
      if(user.Seller){
        form.SlpCode = user.Seller.SlpCode || -1;
      }
      return getSeriesNum(user.activeStore);
    })
    .then(function(seriesNum){
      form.Series = seriesNum; //Assigns seriesNum number depending on activeStore
      form = _.omit(form, _.isUndefined);
      var endPoint = buildUrl(baseUrl, {
        path: path,
        queryParams: form
      });
      sails.log.info('createClient');
      sails.log.info(endPoint);
      reqOptions.uri = endPoint;
      return request(reqOptions);
    });  
}

function updateContact(cardCode, contactIndex, form){
  var path = 'PersonContact(\''+  cardCode +'\')';
  form = _.omit(form, _.isUndefined);
  form.Line = contactIndex;
  var endPoint = buildUrl(baseUrl,{
    path: path,
    queryParams: form
  });
  sails.log.info('updateContact');
  sails.log.info(endPoint);
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

function createContact(cardCode, form){
  var path = 'PersonContact';
  form = _.omit(form, _.isUndefined);
  form.CardCode = cardCode;
  var endPoint = buildUrl(baseUrl,{
    path: path,
    queryParams: form
  });
  sails.log.info('createContact');
  sails.log.info(endPoint);
  reqOptions.uri = endPoint;
  return request(reqOptions);
}


function updateFiscalAddress(cardcode, form){
  form.Address = form.companyName;
  var endPoint = buildAddressContactEndpoint(form, cardcode);
  console.log('updateFiscalAddress', endPoint);
  reqOptions.uri = endPoint;
  return request(reqOptions);
}

function createFiscalAddress(cardcode, form){
  var endPoint = buildAddressContactEndpoint(form, cardcode);
  sails.log.info('createFiscalAddress');
  sails.log.info(endPoint);
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
function createSaleOrder(params){
  return buildSaleOrderRequestParams(params)
    .then(function(requestParams){
      var endPoint = baseUrl + requestParams;
      sails.log.info('createSaleOrder');
      sails.log.info(endPoint);
      reqOptions.uri = endPoint;
      return request(reqOptions);
    });
}

function buildSaleOrderRequestParams(params){
  var requestParams = '/SalesOrder?sales=';
  var products = [];
  var saleOrderRequest = {
    QuotationId: params.quotationId,
    GroupCode: params.groupCode,
    ContactPersonCode: params.cntctCode,
    Currency: 'MXP',
    ShipDate: moment(getFarthestShipDate(params.quotationDetails))
      .format(SAP_DATE_FORMAT),
    SalesPersonCode: params.slpCode || -1,
    CardCode: params.cardCode,
    DescuentoPDocumento: calculateUsedEwalletByPayments(params.payments),
    WhsCode: "02",
    Group: params.currentStore.group
  };

  if(saleOrderRequest.SalesPersonCode === []){
    saleOrderRequest.SalesPersonCode = -1;
  }

  return getAllWarehouses()
    .then(function(warehouses){
      products = params.quotationDetails.map(function(detail){
        var product = {
          ItemCode: detail.Product.ItemCode,
          OpenCreQty: detail.quantity,
          WhsCode: getWhsCodeById(detail.shipCompanyFrom, warehouses),
          ShipDate: moment(detail.shipDate).format(SAP_DATE_FORMAT),
          DiscountPercent: detail.discountPercent,
          Company: detail.Product.U_Empresa,
          Price: detail.total,
          ImmediateDelivery: isImmediateDelivery(detail.shipDate)
          //unitPrice: detail.Product.Price
        };
        return product;
      });

      saleOrderRequest.WhsCode = getWhsCodeById(params.currentStore.Warehouse, warehouses);
      requestParams += JSON.stringify(saleOrderRequest);
      requestParams += '&products=' + JSON.stringify(products);
      requestParams += '&payments=' + JSON.stringify(mapPaymentsToSap(params.payments, params.exchangeRate));

      return requestParams;
    });
}

function isImmediateDelivery(shipDate){
  var currentDate = moment().format();
  shipDate = moment(shipDate).format();
  return currentDate === shipDate;
}

function mapPaymentsToSap(payments, exchangeRate){
  return payments.map(function(payment){
    var paymentSap = {
      TypePay: payment.type,
      PaymentAppId: payment.id,
      amount: payment.ammount
    };
    if(payment.currency === 'usd'){
      paymentSap.rate = exchangeRate;
    }
    if(payment.terminal){
      paymentSap.Terminal = payment.terminal;
      paymentSap.DateTerminal = moment().format(SAP_DATE_FORMAT);
      paymentSap.ReferenceTerminal = payment.verificationCode;
    }
    if(payment.msi || payment.type === 'single-payment-terminal'){
      paymentSap.CardNum = '4802';
      paymentSap.CardDate = '05/16'; //MM/YY
    }
    return paymentSap;
  });
}

function getWhsCodeById(whsId, warehouses){
  var warehouse = _.findWhere(warehouses, {id: whsId});
  if(warehouse){
    return warehouse.WhsCode;
  }
  return false;
}

function getFarthestShipDate(quotationDetails){
  var farthestShipDate = false;
  for(var i=0; i<quotationDetails.length; i++){
    if(
      (
        farthestShipDate && 
        new Date(quotationDetails[i].shipDate) >= farthestShipDate
      ) || 
      i === 0
    ){
      farthestShipDate = quotationDetails[i].shipDate;
    }
  }
  return farthestShipDate;
}

function applyExchangeRateToPayments(payments){
  var mapped = payments.map(function(payment){
    if(currency === 'usd'){
      payment.ammount = payment.ammount * payment.exchangeRate;
    }
    return payment;
  });
}


function calculateUsedEwalletByPayments(payments){
  var ewallet = 0;
  ewallet = payments.reduce(function(amount, payment){
    if(payment.type === 'ewallet'){
      amount += payment.ammount;
    }
    return amount;
  },0);
  return ewallet;
}

function getAllWarehouses(){
  return Company.find({});
}


function getSeriesNum(storeId){
  return Store.findOne({id:storeId}).populate('Warehouse')
    .then(function(store){
      return mapWhsSeries(store.Warehouse.WhsName);
    })
    .catch(function(err){
      console.log(err);
      return err;
    });
}


function mapWhsSeries(whsName){
  var series = 209;
  switch (whsName){
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
    case 'HOME MERIDA':
      series = 210;
      break;
    default:
      series = 209;
      break;
  }

  return series;
}

function buildAddressContactEndpoint(fields, cardcode){
  var path = '/AddressContact';
  var contact = {
    CardCode: cardcode,
    U_Correos: fields.U_Correos,
    FederalTaxID: fields.FederalTaxID
  };
  field = _.omit(fields, _.isUndefined);
  path += '?address=' + JSON.stringify(fields);
  path += '&contact='+ JSON.stringify(contact);
  return baseUrl + path;
}


var baseUrl = 'http://sapnueve.homedns.org:8080';
var request = require('request');
var Promise = require('bluebird');
var buildUrl = require('build-url');
var _ = require('underscore');
var moment = require('moment');
var MOMENT_FORMAT = 'YYYY-MM-D';

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
  return new Promise(function(resolve, reject){
    form = _.omit(form, _.isUndefined);
    var path = 'Contact(\'' + cardcode + '\')';
    var endPoint = buildUrl(baseUrl, {
      path: path,
      queryParams: form
    });
    request.post( endPoint, function(err, response, body){
      if(err){
        reject(err);
      }else{
        resolve(body);
      }
    });
  });
}

function createClient(form){
  return new Promise(function(resolve, reject){
    var path = 'Contact';
    form.CardType = 1; //1.Client, 2.Proveedor, 3.Lead
    form.LicTradNum = form.LicTradNum || 'XXAX010101000';
    User.findOne({id:form.User}).populate('SlpCode')
      .then(function(user){
        //Assigns seller code from SAP
        form.SlpCode = -1;
        if(user.SlpCode && user.SlpCode.length > 0){
          form.SlpCode = user.SlpCode[0].id || -1;
        }
        return getSeriesNum(user.activeStore);
      })
      .then(function(series){
        //Assigns series number depending on activeStore
        form.Series = series;
        form = _.omit(form, _.isUndefined);
        var endPoint = buildUrl(baseUrl, {
          path: path,
          queryParams: form
        });
        sails.log.info('endPoint');
        sails.log.info(endPoint);
        request.post( endPoint, function(err, response, body){
          if(err){
            reject(err);
          }else{
            sails.log.info('body');
            sails.log.info(body);
            resolve(body);
          }
        });
      });
  });
}

function updateContact(cardCode, contactIndex, form){
  return new Promise(function(resolve, reject){
    var path = 'PersonContact(\''+  cardCode +'\')';
    form = _.omit(form, _.isUndefined);
    form.Line = contactIndex;
    form.Address = form.Address.substring(0,100);
    var endPoint = buildUrl(baseUrl,{
      path: path,
      queryParams: form
    });
    sails.log.info('updateContact');
    sails.log.info(endPoint);
    request.post( endPoint, function(err, response, body){
      if(err){
        sails.log.info('err');
        sails.log.info(err);
        return reject(err);
      }
      sails.log.info('body');
      sails.log.info(body);
      resolve(body);
    });
  });
}

function createContact(cardCode, form){
  return new Promise(function(resolve, reject){
    var path = 'PersonContact';
    form = _.omit(form, _.isUndefined);
    form.Address = form.Address.substring(0,100);
    form.CardCode = cardCode;
    var endPoint = buildUrl(baseUrl,{
      path: path,
      queryParams: form
    });
    sails.log.info('createContact');
    sails.log.info(endPoint);
    request.post( endPoint, function(err, response, body){
      if(err){
        sails.log.info('err');
        sails.log.info(err);
        return reject(err);
      }
      sails.log.info('body');
      sails.log.info(body);
      resolve(body);
    });
  });
}


function updateFiscalAddress(cardcode, form){
  return new Promise(function(resolve, reject){
    var path = 'AddressContact(\'' + cardcode + '\')';
    form = _.omit(form, _.isUndefined);
    form.Address = form.companyName;
    var endPoint = buildUrl(baseUrl, {
      path: path,
      queryParams: form
    });
    sails.log.info('updateFiscalAddress');
    sails.log.info(endPoint);
    request.post( endPoint, function(err, response, body){
      if(err){
        return reject(err);
      }
      sails.log.info('body');
      sails.log.info(body);
      resolve(body);
    });
  });
}

function createFiscalAddress(cardcode, form){
  return new Promise(function(resolve, reject){
    var path = 'AddressContact';
    form = _.omit(form, _.isUndefined);
    form.CardCode = cardcode;
    form.Address = form.companyName;
    var endPoint = buildUrl(baseUrl, {
      path: path,
      queryParams: form
    });
    sails.log.info('createFiscalAddress');
    sails.log.info(endPoint);
    request.post( endPoint, function(err, response, body){
      if(err){
        return reject(err);
      }
      sails.log.info('body');
      sails.log.info(body);
      resolve(body);
    });
  });
}


function createSaleOrder(
  cardCode, 
  slpCode,
  cntctCode, 
  quotationDetails //Populated with products
){
  return new Promise(function(resolve, reject){
    buildSaleOrderRequestParams(
      cardCode, 
      slpCode,
      cntctCode, 
      quotationDetails
    ).then(function(requestParams){
      var endPoint = baseUrl + requestParams;
      sails.log.info('endPoint');
      sails.log.info(endPoint);
      request.get( endPoint, function(err, response, body){
        if(err){
          sails.log.info('err');
          sails.log.info(err);
          return reject(err);
        }
        resolve(body);
      });
    });
  });
}

function buildSaleOrderRequestParams(
  cardCode, 
  slpCode,
  cntctCode, 
  quotationDetails //Populated with products
){
  var requestParams = '/SalesOrder?sales=';
  var products = [];
  var saleOrderRequest = {
    Serie:6,
    ContactPersonCode: cntctCode,
    Currency: 'MXP',
    ShipDate: moment(getFarthestShipDate(quotationDetails))
      .format(MOMENT_FORMAT),
    SalesPersonCode: slpCode || -1,
    DescuentoPDocumento: 0,
    CardCode: cardCode,
  };

  if(saleOrderRequest.SalesPersonCode === []){
    saleOrderRequest.SalesPersonCode = -1;
  }

  return getAllWarehouses()
    .then(function(warehouses){
      products = quotationDetails.map(function(detail){
        var product = {
          ItemCode: detail.Product.ItemCode,
          OpenCreQty: detail.quantity,
          WhsCode: getWhsCodeById(detail.shipCompanyFrom, warehouses),
          ShipDate: moment(detail.shipDate).format(MOMENT_FORMAT),
          DiscountPercent: 0,
          Company: detail.Product.U_Empresa
        };
        return product;
      });
      requestParams += JSON.stringify(saleOrderRequest);
      requestParams += '&products=' + JSON.stringify(products);
      return requestParams;
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


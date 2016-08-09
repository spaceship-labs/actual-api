var baseUrl = 'http://sapnueve.homedns.org:8080';
var request = require('request');
var Promise = require('bluebird');
var buildUrl = require('build-url');
var _ = require('underscore');

module.exports = {
  createClient: createClient,
  updateClient: updateClient,
  updateFiscalInfo: updateFiscalInfo
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
    form.LicTradNum = 'XXAX010101000';
    User.findOne({id:form.User}).populate('SlpCode')
      .then(function(user){
        form.SlpCode = -1;
        if(user.SlpCode && user.SlpCode.length > 0){
          form.SlpCode = user.SlpCode[0].id || -1;
        }
        return getSeriesNum(user.companyActive)
      })
      .then(function(series){
        form.Series = series;
        form = _.omit(form, _.isUndefined);
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
  });
}

function updateFiscalInfo(cardcode, form){
  return new Promise(function(resolve, reject){
    var path = 'AddressContact(\'' + cardcode + '\')';
    form = _.omit(form, _.isUndefined);
    var endPoint = buildUrl(baseUrl, {
      path: path,
      queryParams: form
    });
    sails.log.info('updateFiscalInfo');
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
}

function getSeriesNum(companyId){
  return Company.findOne({id:companyId})
    .then(function(company){
      return mapWhsSeries(company.WhsName);
    })
    .catch(function(err){
      console.log(err);
      return err;
    })
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

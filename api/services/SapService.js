var baseUrl = 'http://sapnueve.homedns.org:8080/';
var request = require('request');
var Promise = require('bluebird');
var appendQuery = require('append-query');

module.exports = {
  createClient: createClient,
  updateClient: updateClient,
};

function updateClient(cardcode, form){
  return new Promise(function(resolve, reject){
    var url = baseUrl + 'Contact(\'' + cardcode + '\')';
    var endPoint = appendQuery(url, form);
    request.post( endPoint, function(err, response, body){
      if(err){
        reject(err);
      }else{
        resolve(response);
      }
    });
  });
}

function createClient(form){
  return new Promise(function(resolve, reject){
    var url = baseUrl + 'Contact';
    var endPoint = appendQuery(url, form);
    sails.log.info(endPoint);
    request.post( endPoint, function(err, response, body){
      if(err){
        reject(err);
      }else{
        resolve(body);
      }
    });
  });
}

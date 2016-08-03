var baseUrl = 'http://sapnueve.homedns.org:8080/';
var request = require('request');
var Promise = require('bluebird');
module.exports = {
  updateClient: updateClient
};

function updateClient(cardcode){
  return new Promise(function(resolve, reject){
    request.get(baseUrl + 'Contact', function(err, response, body){
      if(err){
        reject(err);
      }else{
        sails.log.info(response);
        sails.log.info(body);
        resolve(response);
      }
    });
  });

}

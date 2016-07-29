var baseUrl = 'http://sapnueve.homedns.org:8080/';
var request = require('request');
var Promise = require('bluebird');
module.exports = {
  syncProducts: syncProducts
};

function syncProducts(){
  return new Promise(function(resolve, reject){
    request.get(baseUrl + 'Product', function(err, response, body){
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


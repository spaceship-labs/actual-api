var baseUrl = 'http://sapnueve.homedns.org:8080/';
var request = require('request');
var Promise = require('bluebird');
module.exports = {
  syncProducts: syncProducts
};

function syncProducts(){
  var deferred = new Promise();
  request.get(baseUrl + 'Product', function(err, response, body){
    if(err){
      deferred.reject(err);
    }else{
      sails.log.info(response);
      sails.log.info(body);
      deferred.resolve(body);
    }
  });
  return deferred.promise;
}


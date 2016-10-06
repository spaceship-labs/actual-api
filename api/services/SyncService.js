var baseUrl = 'http://sapnueve.homedns.org:8080/';
var request = require('request');
var Promise = require('bluebird');
var BROKER_ROLE_ID = "57915b6d81e8947014bec270";
var ACTUAL_HOME_ID = '57bf590089c75aed0825c3f2';

module.exports = {
  syncProducts: syncProducts,
  importBrokersToUsers: importBrokersToUsers
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

function importBrokersToUsers(){
  var users = [];
  var brokerUsersEmails = [];
  return User.find({
    role: BROKER_ROLE_ID,
    select:['email']
  })
  .then(function(brokerUsers){
    sails.log.info('brokerUsers: ' + brokerUsers.length);
    brokerUsersEmails = brokerUsers.map(function(buser){
      return buser.email;
    });
    return;
  })
  .then(function(){
    return BrokerSAP.find({ U_email: {'!':null}  });
  })
  .then(function(brokers){
    newUsers = brokers.map(mapBrokersToUsers);
    newUsers = newUsers.filter(function(u){
      if(brokerUsersEmails.indexOf(u.email) == -1){
        sails.log.info('Email de broker no registrado: ' + u.email);
      }
      return brokerUsersEmails.indexOf(u.email) === -1;
    });
    newUsers = _.uniq(newUsers, function(u){
      return u.email;
    });
    /*
    sails.log.info('brokerUsersEmails: ' + brokerUsersEmails.length);
    sails.log.info('newUsersEmail : ' + newUsersEmails.length);
    sails.log.info(brokerUsersEmails);
    sails.log.info(newUsersEmails);
    var diff = _.difference(newUsersEmails, brokerUsersEmails);
    sails.log.info('diff');
    sails.log.info(diff);
    */
    return User.create(newUsers);
  })
  .then(function(created){
    return newUsers;
  });
}

function mapBrokersToUsers(broker){
  var params = {
    firstName : broker.Name,
    brokerName : broker.Name,
    brokerCode: broker.Code,
    password: generateRandomString(8),
    //password: "1234",
    activeStore: ACTUAL_HOME_ID,
    mainStore: ACTUAL_HOME_ID,
    email: broker.U_email,
    role: BROKER_ROLE_ID,
    Stores: [ACTUAL_HOME_ID]
  };
  return params;
}

function generateRandomString(length) {
    var charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

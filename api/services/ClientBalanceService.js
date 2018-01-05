var CLIENT_BALANCE_NEGATIVE = 'negative';
var CLIENT_BALANCE_TYPE = 'client-balance';
var Promise = require('bluebird');

module.exports = {
	applyClientBalanceRecord: applyClientBalanceRecord,
	isValidClientBalancePayment: isValidClientBalancePayment,
	getClientBalanceById: getClientBalanceById
};

/*
	@param {<MongoId Client>} clientId
*/
function getUnfinishedClientBalancePayments(clientId){
	var query = {
		Client:clientId, 
		type:CLIENT_BALANCE_TYPE, 
		Order:null, 
		select:['ammount']
	};  
  return Payment.find(query);
}

/*
	@param {<MongoId Client>} clientId
*/
function getClientBalanceById(clientId){
  return Promise.all([
	   getUnfinishedClientBalancePayments(clientId),
	   Client.findOne({id:clientId, select:['Balance']})
  	])
		.then(function(results){
			var unfinishedPayments = results[0];
			var client = results[1];

			if(!client){
				return Promise.reject(new Error('No se encontro el cliente'));
			}

			var sapBalance = client.Balance;
		  appliedBalance = unfinishedPayments.reduce(function(acum, payment){
		    return acum += payment.ammount;
		  },0);
	  	var balance = sapBalance - appliedBalance;	
	  	return balance;
	  });
}

/*
	@param {Object Payment} payment
	@param {<MongoId Client>} clientId
*/
function isValidClientBalancePayment(payment, clientId){
	return getClientBalanceById(clientId)
		.then(function(clientBalance){
		  if (clientBalance < payment.ammount || !clientBalance) {
		  	return false;
		  }
		  return true;			
		});

}

/*
	@param {Object Payment} payment
	@param {Object} options
	options example:
	{
		quotationId: <MongoId Quotation>,
		userId: <MongoId User>,
		client: <Object Client>,
		paymentId: <MongoId Payment> 
	}
*/
function applyClientBalanceRecord(payment, options){
	var client = options.client;
  if (client.Balance < payment.ammount || !client.Balance) {
    return Promise.reject(new Error('Fondos insuficientes en balance de cliente'));
  }
  //var updateParams = {Balance: client.Balance - payment.ammount};
  updateParams = {};

  if(payment.type == CLIENT_BALANCE_TYPE && false){
    var clientBalanceRecord = {
      Store: payment.Store,
      Quotation: options.quotationId,
      User: options.userId,
      Client: options.client.id,
      Payment: options.paymentId,
      type: CLIENT_BALANCE_NEGATIVE,
      amount: payment.ammount
    };
    return ClientBalanceRecord.create(clientBalanceRecord);
  }
  return Promise.resolve(null);

}
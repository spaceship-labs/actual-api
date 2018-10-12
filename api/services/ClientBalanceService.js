var CLIENT_BALANCE_NEGATIVE = 'negative';
var CLIENT_BALANCE_TYPE = 'client-balance';
var Promise = require('bluebird');

module.exports = {
	applyClientBalanceRecord: applyClientBalanceRecord,
	isValidClientBalancePayment: isValidClientBalancePayment,
	getClientBalanceById: getClientBalanceById
};

function getUnfinishedClientBalancePayments(clientId){
	var query = {
		Client:clientId, 
		type:CLIENT_BALANCE_TYPE, 
		Order:null, 
		select:['ammount'],
		status: {'!': PaymentService.statusTypes.CANCELED}
	};  
  return Payment.find(query);
}

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
			var appliedBalance = unfinishedPayments.reduce(function(acum, payment){
				return acum += payment.ammount;
			},0);
			var balance = sapBalance - appliedBalance;	
			return balance;
		});
}

function isValidClientBalancePayment(payment, clientId){
	return getClientBalanceById(clientId)
		.then(function(clientBalance){
			if (clientBalance < payment.ammount || !clientBalance) {
				return false;
			}
			return true;			
		});

}

function applyClientBalanceRecord(payment, options){
	var client = options.client;
  if (client.Balance < payment.ammount || !client.Balance) {
    return Promise.reject(new Error('Fondos insuficientes en balance de cliente'));
  }

  if(payment.type == CLIENT_BALANCE_TYPE){
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
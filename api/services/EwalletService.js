var EWALLET_NEGATIVE = 'negative';

module.exports = {
	applyEwalletPayment: applyEwalletPayment
};

function applyEwalletPayment(payment, options){
	var client = options.client;
  if (client.ewallet < payment.ammount || !client.ewallet) {
    return Promise.reject('Fondos insuficientes');
  }
  var updateParams = {ewallet: client.ewallet - payment.ammount};
  
  return Client.update(client.id, updateParams)
	  .then(function(clientUpdated){
		    if(payment.type == EWALLET_TYPE){
		      var ewalletRecord = {
		        Store: payment.Store,
		        Quotation: options.quotationId,
		        User: options.userId,
		        Client: options.client.id,
		        type: EWALLET_NEGATIVE,
		        amount: payment.ammount
		      };
		      return EwalletRecord.create(ewalletRecord);
		    }
		    return null;
	    });
}
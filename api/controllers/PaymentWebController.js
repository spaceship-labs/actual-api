module.exports = {

	getPaymentWebGroups: function(req, res){
		var paymentGroups = PaymentWebService.getPaymentGroups();
		res.json(paymentGroups);
	}

};
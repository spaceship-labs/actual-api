module.exports = {
	attributes:{
		document: 'string',

		Order:{
			model:'Order'
		},
		PaymentsSap:{
			collection:'PaymentSap',
			via:'OrderSap'
		}
	}
};
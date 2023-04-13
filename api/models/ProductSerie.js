module.exports = {
  schema: true,
	attributes:{
		OrderSap:{
			model:'OrderSap'
		},
		QuotationDetail:{
			model: 'QuotationDetail'
		},
		OrderDetail:{
			model:'OrderDetail'
		},
		seriesNumbers:{
      type:'json', columnType:'array'
		}
	}
};
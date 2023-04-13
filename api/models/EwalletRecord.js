module.exports = {
	schema: true,
  migrate:'alter',
	attributes:{
		type:{
			type:'string',
			isIn:['positive', 'negative']
		},
		amount:{
			type:'number', columnType: 'float',
			required:true
		},
    Store:{
      model:'store'
    },
    Order:{
      model:'Order'
    },
    Quotation:{
      model:'Quotation'
    },
    QuotationDetail:{
      model:'QuotationDetail'
    },
    User:{
      model:'User'
    },
    Client:{
    	model: 'Client'
    },
    Payment:{
      model: 'Payment'
    }
	}
}

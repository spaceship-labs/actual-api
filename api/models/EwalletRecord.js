module.exports = {
	schema: true,
  migrate:'alter',
	attributes: {
    movement: {
      type: 'string',
      enum: ['increase', 'decrease']
    },
    amount: {
      type: 'float',
			required: true,
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
    Payment:{
      model: 'Payment'
    },
    Ewallet: {
      model: 'Ewallet'
    }
  }
}

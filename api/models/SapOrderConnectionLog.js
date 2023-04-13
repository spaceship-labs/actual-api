//APP COLLECTION
module.exports = {
  schema: true,
  attributes: {
    Quotation:{
      model: 'Quotation'
    },
    User:{
      model: 'User'
    },
    Order: {
      model:'Order'
    },
    Store:{
      model: 'Store'
    },
    content:{
      type:'string'
    }
  }
};

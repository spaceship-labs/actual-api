module.exports = {
  //migrate: 'alter',
  tableName: 'QuotationDetail',
  attributes: {
    Quotation: {
      model: 'Quotation'
    }
    /*
    Client:{
      model:'client'
    }
    */
  }
};

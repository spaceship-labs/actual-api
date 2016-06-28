module.exports = {
  migrate: 'alter',
  tableName: 'Quotation',
  attributes: {
    id:{
      type:'integer',
      primaryKey: true,
      autoIncrement: true,
      columnName: 'DocEntry'
    },
    Client:{
      model:'client'
    },
    Seller:{
      model: 'User',
    },
    /*
    Client:{
      model: 'Client',
      columnName: 'SlpCode'
    },
    */
    Details: {
      collection:'QuotationDetail',
      via:'Quotation'
    },
    Records: {
      collection:'QuotationRecord',
      via:'Quotation'
    }
  }
};

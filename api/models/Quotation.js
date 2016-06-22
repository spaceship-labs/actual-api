module.exports = {
  attributes: {
    Client:{
      model:'client'
    },
    Products:{
      //dominant:true,
      collection:'product',
      via: 'Quotations',
      dominant: true
    },
    Client:{
      model: 'Client',
      columnName: 'CardCode'
    },
    Seller:{
      model: 'User',
      columnName: 'SlpCode'
    }
    /*
    Client:{
      model: 'Client',
      columnName: 'SlpCode'
    },
    */
  }
};

module.exports = {
  //migrate: 'alter',
  tableName: 'Quotation',
  attributes: {
    DocEntry:{
      type:'integer',
      primaryKey: true
    },
    Client:{
      model:'client'
    },
    Seller:{
      model: 'User',
    }
    /*
    Client:{
      model: 'Client',
      columnName: 'SlpCode'
    },
    */
  }
};

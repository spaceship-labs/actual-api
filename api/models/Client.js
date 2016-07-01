module.exports = {
  migrate:'alter',
  tableName:'Contact',
  attributes:{
    CardCode:{
      type:'string',
      primaryKey: true
    },
    CardName:{type:'string'},
    Phone1:{type:'string'},
    Phone2:{type:'string'},
    Cellular:{type:'string'},
    E_Mail:{type:'string'},
    Currency:{type:'string'},
    validFor : {type:'string'},
    LicTradNum : {type:'string'},
    Free_Text : {type:'text'},
    SlpCode : {type:'integer'},
    /*Seller:{
      model:'User',
      columnName: 'SlpCode'
    }
    */
    Quotations: {
      collection:'Quotation',
      via: 'Client',
    },

    Info: {
      model:'ClientInfo'
    }
  }
}

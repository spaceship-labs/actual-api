module.exports = {
  connection: 'mysql',
  migrate: 'safe',
  tableName: 'Product',
  tableNameSqlServer: 'OITM',
  attributes: {
    ItemCode:{
      type:'string',
      primaryKey:true
    },

    ItemName:{type:'string'},
    CodeBars:{type:'string'},
    OnHand:{type:'string'},
    IsCommited:{type:'float'},
    OnOrder:{type:'string'},
    SalUnitMsr:{type:'string'},
    U_LINEA:{type:'string',size:60},
    U_PRODUCTO:{type:'string',size:60},
    U_COLOR:{type:'string',size:60},
    U_garantia:{type:'string',size:60},

    files: {
      collection: 'productfile',
      via:'Product',
      //excludeSync: true
    },

    icon_filename:{type:'string'},
    icon_name:{type:'string'},
    icon_type:{type:'string'},
    icon_typebase:{type:'string'},
    icon_size:{type:'integer'},


    //FIELDS FROM PRICE TABLE
    PriceList:{type:'integer', size: 4},
    Price:{type:'float'},
    Currency:{type:'string',size:3} 

  },

}

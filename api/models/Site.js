module.exports = {
  migrate:'alter',
  schema:true,
  attributes:{
    name:{type:'string'},
    handle:{type:'string',
    required:true,
    unique:true},
    deliveryText: {type:'string'},
    exchangeRate: {type:'number', columnType: 'float'},
    bannersOrder:{type:'string'},

    Banners:{
    	collection: 'SiteBanner',
    	via:'Site'
    }
  }
};

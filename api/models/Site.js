module.exports = {
  migrate:'alter',
  schema:true,
  attributes:{
    name:{type:'string'},
    handle:{type:'string',unique:true},
    deliveryText: {type:'text'},
    exchangeRate: {type:'float'},
    bannersOrder:{type:'string'},

    Banners:{
    	collection: 'SiteBanner',
    	via:'Site'
    }
  }
};

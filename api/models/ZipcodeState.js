module.exports = {
  schema: true,
  migrate:'alter',
  attributes: {
  	name: {type: 'string'},
    deliveryPriceValue: {type:'number', columnType: 'float'},
    deliveryPriceMode: {
      type: 'string',
      isIn : ['percentage', 'amount']
    },
    isActive: {type:'boolean'},
    Zipcodes:{
    	collection: 'ZipcodeDelivery',
    	via: 'ZipcodeState'
    }
  }
};

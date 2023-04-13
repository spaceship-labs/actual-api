//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    name:{type:'string'},
    publicName:{type:'string'},
    code:{type:'string',
    required:true,
    unique:true},
    handle:{type:'string'},
    type:{type:'string'},
    startDate:{type:'string',columnType:'datetime'},
    endDate:{type:'string',columnType:'datetime'},
    discountPg1:{type:'number', columnType: 'float'},
    discountPg2:{type:'number', columnType: 'float'},
    discountPg3:{type:'number', columnType: 'float'},
    discountPg4:{type:'number', columnType: 'float'},
    discountPg5:{type:'number', columnType: 'float'},
    discountTextPg1:{type:'string'},
    discountTextPg2:{type:'string'},
    discountTextPg3:{type:'string'},
    discountTextPg4:{type:'string'},
    discountTextPg5:{type:'string'},
    ewalletPg1:{type:'number', columnType: 'float'},
    ewalletPg2:{type:'number', columnType: 'float'},
    ewalletPg3:{type:'number', columnType: 'float'},
    ewalletPg4:{type:'number', columnType: 'float'},
    ewalletPg5:{type:'number', columnType: 'float'},
    ewalletTypePg1:{
      type:'string',
      isIn: ['ammount','percentage']
    },
    ewalletTypePg2:{
      type:'string',
      isIn: ['ammount','percentage']
    },
    ewalletTypePg3:{
      type:'string',
      isIn: ['ammount','percentage']
    },
    ewalletTypePg4:{
      type:'string',
      isIn: ['ammount','percentage']
    },
    ewalletTypePg5:{
      type:'string',
      isIn: ['ammount','percentage']
    },
    sa: {type:'string'}, //Sociedad
    hasPriority:{type:'boolean'},
    hasLM:{type:'boolean'},
    pushMoneyUnit:{type:'number', columnType: 'float'},
    pushMoneyUnitType:{
      type:'string',
      isIn:['ammount','percent']
    },

  }
};

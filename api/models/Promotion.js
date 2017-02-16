//APP COLLECTION
module.exports = {
  schema:true,
  migrate: 'alter',
  attributes: {
    name:{type:'string'},
    publicName:{type:'string'},
    code:{type:'string',unique:true},
    handle:{type:'string'},
    type:{type:'string'},
    startDate:{type:'datetime'},
    endDate:{type:'datetime'},
    discountPg1:{type:'float'},
    discountPg2:{type:'float'},
    discountPg3:{type:'float'},
    discountPg4:{type:'float'},
    discountPg5:{type:'float'},
    discountTextPg1:{type:'string'},
    discountTextPg2:{type:'string'},
    discountTextPg3:{type:'string'},
    discountTextPg4:{type:'string'},
    discountTextPg5:{type:'string'},
    ewalletPg1:{type:'float'},
    ewalletPg2:{type:'float'},
    ewalletPg3:{type:'float'},
    ewalletPg4:{type:'float'},
    ewalletPg5:{type:'float'},
    ewalletTypePg1:{
      type:'string',
      enum: ['ammount','percentage']
    },
    ewalletTypePg2:{
      type:'string',
      enum: ['ammount','percentage']
    },
    ewalletTypePg3:{
      type:'string',
      enum: ['ammount','percentage']
    },
    ewalletTypePg4:{
      type:'string',
      enum: ['ammount','percentage']
    },
    ewalletTypePg5:{
      type:'string',
      enum: ['ammount','percentage']
    },
    sa: {type:'string'}, //Sociedad
    hasPriority:{type:'boolean'},
    hasLM:{type:'boolean'},
    pushMoneyUnit:{type:'float'},
    pushMoneyUnitType:{
      type:'string',
      enum:['ammount','percent']
    },

  }
};

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
    sa: {type:'string'}, //Sociedad
    hasPriority:{type:'boolean'},
    hasLM:{type:'boolean'},
    pushMoneyUnit:{type:'float'},
    pushMoneyUnitType:{
      type:'string',
      enum:['ammount','percent']
    },
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
    discountRange1:{ type:'float' },
    discountRange2:{ type:'float' },
    discountRange3:{ type:'float' },
    discountRange4:{ type:'float' },
    discountRange5:{ type:'float' },
    discountRange6:{ type:'float' },
    discountRange7:{ type:'float' },
    discountRange8:{ type:'float' },
    discountRange9:{ type:'float' },
    discountRange10:{ type:'float' },
    discountRangePercent1:{ type:'integer' },
    discountRangePercent2:{ type:'integer' },
    discountRangePercent3:{ type:'integer' },
    discountRangePercent4:{ type:'integer' },
    discountRangePercent5:{ type:'integer' },
    discountRangePercent6:{ type:'integer' },
    discountRangePercent7:{ type:'integer' },
    discountRangePercent8:{ type:'integer' },
    discountRangePercent9:{ type:'integer' },
    discountRangePercent10:{ type:'integer' },
    productTypeDiscounts:{ type:'json' },
  }
};

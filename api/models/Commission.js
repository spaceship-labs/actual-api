//APP COLLECTION
module.exports = {
  migrate: 'alter',
  attributes: {
    type:{
      type:'string',
      enum:['seller','manager','broker']
    },
    startDate: {type:'datetime'},
    endDate:{type:'datetime'},
    basePercent: {type:'float'},
    personalGoal: {type:'float'},
    hasToCompleteGoal:{type:'boolean'},
    personalGoal2: {type:'float'},
    hasToCompleteGoal2:{type:'boolean'},
    storeGoal:{type:'float'},
    storeGoal2:{type:'float'},

    paymentByCreditCard:{type:'boolean'},
    paymentByCash: {type:'boolean'},
    paymentByTransfer:{type:'boolean'},
    paymentByEWallet:{type:'boolean'},

    percentGroup1: {type:'float'},
    percentGroup2: {type:'float'},
    percentGroup3: {type:'float'},

    managerGoal:{type:'float'},
    managerGoal2:{type:'float'},

  }

};


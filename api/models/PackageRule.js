module.exports = {
  schema: true,
  migrate:'alter',
  attributes:{
    quantity: {type:'number', required:true},
    discountPg1: {type:'number', columnType: 'float', required:true},
    discountPg2: {type:'number', columnType: 'float', required:true},
    discountPg3: {type:'number', columnType: 'float', required:true},
    discountPg4: {type:'number', columnType: 'float', required:true},
    discountPg5: {type:'number', columnType: 'float', required:true},

    Product:{
      model:'Product'
    },
    PromotionPackage:{
      model:'ProductGroup'
    }
  }
};

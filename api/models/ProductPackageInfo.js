module.exports = {
  schema: true,
  migrate:'alter',
  attributes:{
    quantity: {type:'integer', required:true},
    discount: {type:'float', required:true},
    discountType: {
      type:'string',
      enum:['ammount','percentage']
    },

    discountPg2: {type:'float', required:true},
    discountPg3: {type:'float', required:true},
    discountPg4: {type:'float', required:true},
    discountPg5: {type:'float', required:true},

    Product:{
      model:'Product'
    },
    Package:{
      model:'ProductGroup'
    }
  }
};

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
    Product:{
      model:'Product'
    },
    Package:{
      model:'ProductGroup'
    }
  }
};

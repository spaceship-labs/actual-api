module.exports = {
  tableName: 'ItemPrice',
  attributes: {
    Product:{
      model: 'Product',
      via: 'ProductPrice',
      columnName: 'ItemCode'
    },
  }
};

module.exports = {
  migrate: 'alter',
  tableName: 'ItemPrice',
  attributes: {
    ItemCode: {type:'string'}
    /*Product:{
      model: 'Product',
      columnName: 'ItemCode',
      foreignKey: true
    },
    */
  }
};

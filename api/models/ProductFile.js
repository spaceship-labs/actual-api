//APP COLLECTION
module.exports = {
  schema: true,
  attributes: {
    filename: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string' },
    typebase: { type: 'string' },
    size: { type: 'integer' },
    Product: {
      model: 'product',
      columnName: 'ItemCode',
    },
  },
};

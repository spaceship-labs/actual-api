//APP COLLECTION
module.exports = {
  schema: true,
  attributes: {
    filename: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string' },
    typebase: { type: 'string' },
    size: { type: 'integer' },
    displayText: { type: 'string' },
    displayUrl: { type: 'string' },
    newTab: {
      type: 'boolean',
    },
    Site: {
      model: 'site',
    },
  },
};

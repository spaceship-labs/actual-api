//APP COLLECTION
module.exports = {
  schema: true,
  attributes: {
    filename: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string' },
    typebase: { type: 'string' },
    size: { type: 'number' },
    displayText: { type: 'string' },
    displayUrl: { type: 'string' },
    newTab: {
      type: 'boolean',
    },
    secondBanner: {
      type: 'boolean',
      defaultsTo: false
    },
    Site: {
      model: 'site',
    },
  },
};

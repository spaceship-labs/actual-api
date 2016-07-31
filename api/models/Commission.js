//APP COLLECTION
module.exports = {
  migrate: 'alter',
  attributes: {
    name: {
      type: 'string',
      required: true,
      unique: true
    },
    individualGoal: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    storeGoal: {
      type: 'float',
      required: true,
      defaultsTo: 0
    },
    individualRate: {
      type: 'float',
      min: 0,
      max: 1,
      required: true
    },
    storeRate: {
      type: 'float',
      min: 0,
      max: 1,
      required: true
    },
    type: {
      model: 'role'
    }
  }
};


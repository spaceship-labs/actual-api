/**
 * Goal.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    goal: {
      type: 'float',
      required: true
    },
    sellers: {
      type: 'integer',
      required: true
    },
    goalStore: {
      type: 'float',
      required: true,
      defaultsTo: 0,
    },
    sellersStore: {
      type: 'integer',
      required: true,
      defaultsTo: 0,
    },
    date: {
      type: 'date',
      required: true
    },
    company: {
      model: 'company',
      required: true
    }
  },
  beforeCreate: function(val, cb){
    var q = {
      company: val.company,
      date: val.date
    };
    Goal.findOne(q).exec(function(err, c) {
      if (err) {
        return cb(err);
      }
      if (c) {
        return cb('No pueden haber 2 reglas en la misma tienda, en la misma fecha');
      }
      cb();
    });
  },
  beforeUpdate: function(val, cb) {
    console.log(val);
    var q = {
      id: {'!': val.id},
      company: val.company,
      date: val.date
    };
    Goal.findOne(q).exec(function(err, c) {
      if (err) {
        return cb(err);
      }
      console.log(c);
      if (c) {
        return cb('No pueden haber 2 reglas en la misma tienda, en la misma fecha');
      }
      cb();
    });

  }
};


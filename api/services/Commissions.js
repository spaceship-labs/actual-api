var _ = require('underscore');

module.exports = {
  calculate: calculate
};

function calculate(payment) {

}

function userTotal(user, dateFrom, dateTo) {
   return User
    .findOne(user)
    .populate('mainStore')
    .then(function(user) {
      return Store.findOne(user.mainStore.id);
    })
    .then(function(store) {
      var query = queryDate({Store: store, User: user}, dateFrom, dateTo);
      return Payment.find(query);
    })
    .then(function(payments) {
      return sumPayments(payments);
    });
}

function storeTotal(user, dateFrom, dateTo) {
  return User
    .findOne(user)
    .populate('mainStore')
    .then(function(user) {
      return Store.findOne(user.mainStore.id);
    })
    .then(function(store) {
      var query = queryDate({Store: store}, dateFrom, dateTo);
      return Payment.find(query);
    })
    .then(function(payments) {
      return sumPayments(payments);
    });
}

function sumPayments(payments) {
  return payments.reduce(function(acum, current) {
    if (current.currency == 'usd') {
      return acum + (current.ammount * current.exchangeRate);
    } else {
      return acum + current.ammount;
    }
  }, 0);
}

function queryDate(query, dateFrom, dateTo) {
  var dateFrom = new Date(dateFrom);
  var dateTo   = new Date(dateTo);
  return _.assign(query, {
    createdAt: {
      '>=': dateFrom,
      '<': addOneDay(dateTo)
    }
  });
}

function addOneDay(date) {
  var date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date;
}

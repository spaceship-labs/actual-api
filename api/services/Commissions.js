var Promise = require('bluebird');
var _       = require('underscore');

module.exports = {
  calculate: calculate,
  calculateUser: calculateUser
};

function calculate(store, dateFrom, dateTo) {
  var query = queryDate({Store: store}, dateFrom, dateTo);
  return Payment
    .find(query)
    .sort('createdAt ASC')
    .then(function(payments) {
      return payments.map(function(p) {return p.User});
    })
    .then(function(users) {
      return users.map(function(user) {
        return calculateUser(user, dateFrom, dateTo);
      });
    })
    .all();
}

function calculateUser(user, dateFrom, dateTo) {
  var query = queryDate({User: user}, dateFrom, dateTo);
  return Promise
    .all([userRate(user, dateFrom, dateTo), Payment.find(query)])
    .spread(function(rate, payments) {
      return payments.map(function(payment) {
        return Commission
          .findOrCreate({payment: payment, user: user}, {payment: payment, user: user})
          .then(function(commission) {
            return Commission.update({payment: payment.id, user: user}, {rate: rate});
          })
      });
    })
    .all();
}



function userRate(user, dateFrom, dateTo) {
  return User
    .findOne(user)
    .populate('mainStore')
    .populate('role')
    .then(function(user) {
      var date = setFirstDay(dateFrom);
      return [
        Goal.findOne({date: date, store: user.mainStore.id}),
        user.role.name,
        userTotal(user.id, dateFrom, dateTo),
        storeTotal(user.mainStore.id, dateFrom, dateTo)
      ];
    })
    .spread(function(goal, role, utotal, stotal) {
      var sellers     = goal.sellers;
      var gstore1     = goal.goal;
      var gstore2     = goal.goal * 1.25;
      var gseller1    = gstore1 / sellers;
      var gseller2    = gstore2 / sellers;
      var baseSeller  = 3;
      var baseManager = 0;
      //seller
      if (utotal >= gseller1) {
        baseSeller += 1;
      }
      if (utotal >= gseller2) {
        baseSeller += 1;
      }
      if (utotal >= gseller1 && stotal >= gstore1) {
        baseSeller += 0.5;
      }
      if (utotal >= gseller2 && stotal >= gstore2) {
        baseSeller += 0.5;
      }
      //manager
      if (stotal >= gstore1) {
        baseManager += 0.5;
      }
      if (stotal >= gstore2) {
        baseManager += 0.5;
      }
      if (role == 'seller') {
        return baseSeller / 100;
      }
      if (role == 'store manager' || role == 'admin') {
        return baseManager / 100;
      }
      return 0;
    });
}

function userTotal(user, dateFrom, dateTo) {
  var query = queryDate({User: user}, dateFrom, dateTo);
  return Payment
    .find(query)
    .then(function(payments) {
      return sumPayments(payments);
    });
}

function storeTotal(store, dateFrom, dateTo) {
  var query = queryDate({Store: store}, dateFrom, dateTo);
  return Payment
    .find(query)
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
  dateFrom.setHours(0, 0, 0, 0);
  dateTo.setHours(0, 0, 0, 0);
  return _.assign(query, {
    createdAt: {
      '>=': dateFrom,
      '<': addOneDay(dateTo)
    }
  });
}

function setFirstDay(date) {
  var date = new Date(date);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addOneDay(date) {
  var date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date;
}

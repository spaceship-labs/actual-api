var Promise = require('bluebird');
var _       = require('underscore');

module.exports = {
  calculate: calculate,
};

function calculate(store) {
  var date  = new Date();
  var first = setFirstDay(new Date());
  var last  = setLastDay(new Date());
  if (date.getDate() <= 15) {
    var fdate = first;
    var ldate = addDays(first, 14);
  } else {
    var fdate = addDays(first, 15);
    var ldate = last;
  }
  return calculateStore(store, fdate, ldate);
}

function calculateStore(store, dateFrom, dateTo) {
  var query = queryDate({Store: store}, dateFrom, dateTo);
  return Payment
    .find(query)
    .sort('createdAt ASC')
    .then(function(payments) {
      var users = payments
        .map(function(p) {
          return p.User
        })
        .reduce(function(acum, current) {
          if (acum.indexOf(current) == -1) {
            return acum.concat(current);
          }
          return acum;
        }, []);
      return User.find(users);
    })
    .then(function(users) {
      return users.map(function(user) {
        return calculateUser(user.mainStore, user.id, dateFrom, dateTo);
      });
    })
    .all();
}

function calculateUser(store, user, dateFrom, dateTo) {
  var query = queryDate({User: user}, dateFrom, dateTo);
  return Promise
    .all([userRate(user, dateFrom, dateTo), Payment.find(query)])
    .spread(function(rate, payments) {
      return payments.map(function(payment) {
        return Commission
          .findOne({payment: payment.id, user: user})
          .then(function(commission) {
            return commission || Commission.create({payment: payment.id, user: user, store: store});
          })
          .then(function(commission) {
            var ammount = (rate * payment.ammount).toFixed(2);
            return Commission.update(
              {payment: payment.id, user: user},
              {datePayment: payment.createdAt, ammountPayment: payment.ammount, rate: rate, ammount: ammount }
            );
          });
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
      var gstore1     = goal.goal / 2;
      var gstore2     = gstore1 * 1.25;
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

function setLastDay(date) {
  var date = new Date(date);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function setFirstDay(date) {
  var date = new Date(date);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addOneDay(date) {
  var date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date;
}

function addDays(date, days) {
  var date = new Date(date);
  date.setDate(date.getDate() + days);
  return date;
}

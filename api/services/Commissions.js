var Promise = require('bluebird');
var moment  = require('moment');
var _       = require('underscore');
var IVA     = 0.16;

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
            var ammount = (rate * payment.ammount / (1 + IVA)).toFixed(2);
            var _rate = rate;
            if (payment.type == 'ewallet') {
              ammount = 0;
              _rate = 0;
            }
            return Commission.update(
              {payment: payment.id, user: user},
              {datePayment: payment.createdAt, ammountPayment: payment.ammount, rate: _rate, ammount: ammount }
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
      var date  = setFirstDay(dateFrom);
      var query = queryGoalDate({store: user.mainStore.id}, date);
      return [
        Goal.findOne(query),
        user.role.name,
        userTotal(user.id, dateFrom, dateTo),
        storeTotal(user.mainStore.id, dateFrom, dateTo)
      ];
    })
    .spread(function(goal, role, utotal, stotal) {
      console.log('the goal of this period is : ', goal);
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
  var query = queryDate({User: user, type: {'!': 'ewallet'}}, dateFrom, dateTo);
  return Payment
    .find(query)
    .then(function(payments) {
      return sumPayments(payments);
    });
}

function storeTotal(store, dateFrom, dateTo) {
  var query = queryDate({Store: store, type: {'!': 'ewallet'}}, dateFrom, dateTo);
  return Payment
    .find(query)
    .then(function(payments) {
      return sumPayments(payments);
    });
}

function sumPayments(payments) {
  return payments.reduce(function(acum, current) {
    var ammount = 0;
    if (current.currency == 'usd') {
      ammount = acum + (current.ammount * current.exchangeRate);
    } else {
      ammount = acum + current.ammount;
    }
    return ammount / (1 + IVA);
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

function queryGoalDate(query, date) {
  var date1 = moment(date);
  var date2 = moment(date);
  return _.assign(query, {
    date: {
      '>=': date1.add(-1, 'days').format('YYYY-MM-DD'),
      '<': date2.add(1, 'days').format('YYYY-MM-DD'),
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

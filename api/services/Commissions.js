var _      = require('underscore');

module.exports = {
  user: userCommissions,
};

function userCommissions(idUser, dateFrom, dateTo) {
  return User.findOne(idUser).populate('role')
    .then(function(user){
      var type = user.role.map(function(role){return role.id;});
      return [
        Commission.find({type: type}),
        userSales(idUser, dateFrom, dateTo),
        companySales(user.companyMain, dateFrom ,dateTo)
      ];
    })
    .spread(function(comissions, totalUser, totalStore) {
      return comissions.reduce(function(acum, current) {
        if (totalUser >= current.individualGoal  && totalStore >= current.storeGoal) {
          return acum + (current.individualRate * totalUser) + (current.storeRate * totalStore);
        }
        return acum;
      }, 0);
    });
}

function userSales(idUser, dateFrom, dateTo) {
  var query = queryDate({User: idUser}, dateFrom, dateTo);
  return Order
    .find(query)
    .then(function(orders) {
      return orders.reduce(function(acum, current) {
        return acum + current.total;
      }, 0);
    });
}

function companySales(idCompany, dateFrom, dateTo) {
  var query = queryDate({Store: idCompany}, dateFrom, dateTo);
  return Order
    .find(query)
    .then(function(orders){
      return orders.reduce(function(acum, current) {
        return acum + current.total;
      }, 0);
    });
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

function sameDay(date1, date2) {
  return date1.toDateString() == date2.toDateString();
}

function addOneDay(date) {
  var date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date;
}

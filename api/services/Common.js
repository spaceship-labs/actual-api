var _ = require('underscore');
var q = require('q');

module.exports = {
  validateEmail: function(email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
  },
  find: function(modelName,form,searchFields, populateFields){
    var deferred = q.defer();
    var items = form.items || 10;
    var page = form.page || 1;
    var term = form.term || false;
    var orderBy = form.orderby || false;
    var populateFields = populateFields || false;
    var query = {};
    var querySearchAux = {};
    var model = sails.models[modelName];
    //console.log(model);
    if(term){
      if(searchFields.length > 0){
        query.or = [];
        for(var i=0;i<searchFields.length;i++){
          var field = searchFields[i];
          var obj = {};
          obj[field] = {contains:term};
          query.or.push(obj);
        }
      }
      querySearchAux = _.clone(query);
    }
    query.skip = (page-1) * items;
    query.limit = items;

    var read = model.find(query);
    if(populateFields.length > 0){
      populateFields.forEach(function(populateF){
        read = read.populate(populateF);
      });
    }

    if(orderBy){
      read.sort(orderBy);
    }

    read.exec(function(err, results){
      if(err) console.log(err);
      model.count(querySearchAux).exec(function(err2,count){
        if(err2){
          throw(err2);
          deferred.reject(err);
        }else{
          deferred.resolve({data:results, total:count});
        }
      })
    });

    return deferred.promise;
  }
}

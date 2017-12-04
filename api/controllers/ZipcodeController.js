var Promise = require('bluebird');

module.exports = {

  listZipcodeStates: function(req, res){
    ZipcodeState.find()
      .then(function(result){
        res.json(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  multipleUpdate: function(req, res){
    var params = req.allParams();
    
    Promise.mapSeries(params.zipcodeStates , function(state){
      var updateQuery = {id: state.id};
      return ZipcodeState.update(updateQuery, state);
    })
    .then(function(results){
      res.json(results);
    });

  },

  list: function(req, res){
    var form  = req.params.all();
    var page  = form.page;
    var limit = form.limit;
    var find = ZipcodeDelivery.find();

    if(limit && page){
      find = find.paginate({page:page, limit:limit});
    }

    find.then(function(zipcodes){
        return res.json(zipcodes);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }

};
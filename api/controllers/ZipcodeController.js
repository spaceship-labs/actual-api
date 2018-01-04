var Promise = require('bluebird');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

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
    
    //@params {array ZipcodeState} params.zipcodeStates 
    Promise.mapSeries(params.zipcodeStates , function(state){
      var updateQuery = {_id: ObjectId(state.id)};
      updateParams = {
        deliveryPriceValue: state.deliveryPriceValue,
        deliveryPriceMode: state.deliveryPriceMode
      };
      return Common.nativeUpdateOne(updateQuery, updateParams, ZipcodeState);
    })
    .then(function(results){
      res.json(results);
    });

  },

  list: function(req, res){
    var form  = req.params.all();

    //@param {Object} form
    //Example:
    /*
      {
        page: 1,
        limit: 20
      }
    */
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
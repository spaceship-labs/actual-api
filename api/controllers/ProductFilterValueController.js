var _ = require('underscore');
var util = require('util');
var ObjectId = require('mongodb').ObjectID;

module.exports = {
  create: function(req, res){
    var form = req.params.all();
    //@param {Object ProductFilterValue} form
    ProductFilterValue.create(form)
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    //@param {Object ProductFilterValue} form
    ProductFilterValue.update({id:id},form)
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;
    //@param {id/hexadecimal} id    
    ProductFilterValue.destroy({id:id})
      .then(function(){
        res.json({destroyed:true});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });

  },

};

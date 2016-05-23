var _ = require('underscore');
var async = require('async');

module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'productfilter';
    var searchFields = ['Name'];
    //var populateFields = ['Categories'];
    Common.find(model, form, searchFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  list: function(req, res){
    var form = req.params.all();
    var reading;
    if(form.quickread){
      reading = ProductFilter.find();
    }else{
      reading = ProductFilter.find().populate('Values');
    }
    reading.exec(function(err, filters){
      if(err) throw(err);
      res.json(filters);
    });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductFilter.findOne({id:id}).populate('Values').populate('Categories').exec(function(err, filter){
      if(err){
        console.log(err);
        throw(err);
      }
      res.json(filter);
    });
  },

  //TODO: check why .add() doesnt work on categories.
  create: function(req, res){
    var form = req.params.all();
    //Creating filter
    ProductFilter.create(form).exec(function(err, created){
      if(err){
        console.log(err);
        throw(err);
      }
      res.json(created);

    });
  },


  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    sails.log.debug(form);
    ProductFilter.update({id:id},form).exec(function updateDone(err, updatedFilter){
      if(err){
        console.log(err);
        throw err;
      }
      res.json(updatedFilter);
    });
  },



  destroy: function(req, res){
    var form = req.params.all();
    var id = form.id;

    ProductFilter.destroy({id:id}).exec(function(err){
      if(err) throw(err);
      res.json({destroyed:true})
    });
  }
};

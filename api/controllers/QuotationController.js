module.exports = {

  create: function(req, res){
    var form = req.params.all();
    Quotation.create(form).exec(function(err1, result){
      if(err1) console.log(err1);
      if(result){
        res.json(result);
      }
      else{
        res.json(false);
      }
    });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Quotation.findOne({id: id}).populate('Client').exec(function findCB(err, quotation){
      if(err) console.log(err);
      res.json(quotation);
    });
  },

  findByClient: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'quotation';
    var searchFields = [];
    var selectFields = form.fields;
    var populateFields = [];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  }

};

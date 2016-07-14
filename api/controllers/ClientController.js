
module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'client';
    var searchFields = ['id','CardName','CardCode','firstName','lastName','E_Mail','phone'];
    var selectFields =[];
    var populateFields = [];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  findBySeller: function(req, res){
    var form = req.params.all();
    var model = 'client';
    var searchFields = ['CardCode','CardName'];
    var selectFields =[];
    var populateFields = ['Quotations'];
    form.filters = {SlpCode: form.seller};
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    //Product.find({id:id}).exec(function(err, results){
    Client.findOne({id:id})
      .populate('Info')
      //.populate('Quotations')
      //.populate('Groups')
      //.populate('stock')
      .exec(function(err, client){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        res.json(client);
      }
    });
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Client.update({id: id}, form).exec(function updateCB(err, updated) {
      if(err) console.log(err);
      res.json(updated);
    });
  }

  /*
  updateInfo: function(req, res){
    var form = req.params.all();
    var client = form.client;
    sails.log.debug('client : ' + client);
    form.Client = client || false;
    delete form.id;
    delete form.client;
    ClientInfo.findOne({Client: client}).exec(function findCB(err, found){
      if(err) console.log(err);
      if(found){
        delete form.client;
        ClientInfo.update({id: found.id}, form).exec(function updateCB(err2, updated){
          if(err2) console.log(err2);
          res.json(updated);
        });
      }else{
        ClientInfo.create(form).exec(function createCB(err3, created){
          res.json(created);
          if(err3) console.log(err3);
        });
      }

    });
  }*/

};

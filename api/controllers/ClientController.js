
module.exports = {
  create: function(req, res) {
    var form       = req.params.all();
    var email      = form.email;
    var actualMail =  /@actualgroup.com$/
    if (email && email.match(actualMail)) {
      return res.badRequest({
        error: 'user could not be created with an employee\'s mail'
      });
    }
    return res.badRequest({error: 'this endpoint is not finished'});
  },
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
    Client.findOne({id:id})
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


};

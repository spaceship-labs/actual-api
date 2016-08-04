
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
    var clientFound = false;
    Client.findOne({id:id}).then(function(client){
      if(client){
        clientFound = client;
        return ClientContact.find({CardCode: client.CardCode});
      }
      return [];
    })
    .then(function(contacts){
      clientFound = clientFound.toObject();
      clientFound.Contacts = contacts;
      res.json(clientFound);
    })
    .catch(function(err){
      console.log(err);
      return res.negotiate(err);
    });

  },

  create: function(req, res) {
    var form       = req.params.all();
    var email      = form.email;
    var actualMail =  /@actualgroup.com$/
    if (email && email.match(actualMail)) {
      return res.badRequest({
        error: 'user could not be created with an employee\'s mail'
      });
    }
    form = mapClientFields(form);

    SapService.createClient(form)
      .then(function(result){
        sails.log.info(result);
        return Client.create(form);
      })
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
    var CardCode = form.CardCode;
    form = mapClientFields(form);

    SapService.updateClient(CardCode, form)
      .then(function(result){
        return Client.update({CardCode: CardCode}, form);
      })
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getContactsByClient: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    ClientContact.find({CardCode:CardCode}).then(function(contacts){
      res.json(contacts);
    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    })
  }

};

function mapClientFields(fields){
  sails.log.info(fields);
  //Name
  fields.CardName = fields.firstName || fields.CardName;
  if(fields.firstName && fields.lastName){
    fields.CardName = fields.firstName + ' ' + fields.lastName;
  }
  //Phone
  fields.Phone1 = fields.phone || fields.Phone1;
  if(fields.phone && fields.dialCode){
    fields.Phone1 = fields.dialCode + fields.phone;
  }
  //Mobilephone
  fields.Cellular = fields.mobilePhone || fields.Cellular;
  if(fields.mobilePhone && fields.mobileDialCode){
    fields.Cellular = fields.mobileDialCode + fields.mobilePhone;
  }
  fields.E_Mail = fields.email || fields.E_Mail;
  return fields;
}

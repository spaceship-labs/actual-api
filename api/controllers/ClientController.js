var _ = require('underscore');
var Promise = require('bluebird');

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
      if(!clientFound){
        return Promise.reject('Cliente no encontrado');
      }
      clientFound = clientFound.toObject();
      clientFound.Contacts = contacts;
      return FiscalInfo.find({CardCode: clientFound.CardCode, AdresType:'S'});
    })
    .then(function(fiscalInfo){
      clientFound.FiscalInfo = fiscalInfo;
      res.json(clientFound);
    })
    .catch(function(err){
      console.log(err);
      return res.negotiate(err);
    });

  },

  create: function(req, res) {
    var form           = req.params.all();
    var email          = form.email;
    var actualMail     =  /@actualgroup.com$/;
    var createdContact = false;
    if (email && email.match(actualMail)) {
      return res.badRequest({
        error: 'user could not be created with an employee\'s mail'
      });
    }
    form            = mapClientFields(form);
    form.User       = req.user.id;
    var contacts    = (form.contacts || []).filter(function(c){
      return !_.isUndefined(c.FirstName);
    });
    var fiscalData  = (form.fiscalData || []).filter(function(f){
      return !_.isUndefined(f.companyName);
    });

    SapService.createClient(form)
      .then(function(result){
        result = JSON.parse(result);
        if( !result.value || !isValidCardCode(result.value)  ) {
          var err = result.value || 'Error al crear socio de negocio';
          return Promise.reject(err);
        }
        form.CardCode = result.value;
        return Client.create(form);
      })
      .then(function(created){
        if(created.err){
          return res.negotiate(created.err);
        }
        createdContact = created;
        if(contacts && contacts.length > 0){
          contacts = contacts.map(function(c){
            c.CardCode = createdContact.CardCode;
            return c;
          });
          return Promise.each(contacts, createContactPromise);
        }
        return created;
      })
      .then(function(result){
        if(fiscalData && fiscalData.length > 0){
          fiscalData = fiscalData.map(function(f){
            f.CardCode = createdContact.CardCode;
            return f;
          });
          return Promise.each(fiscalData, createFiscalInfoPromise);
        }
        return result;
      })
      .then(function(result){
        res.json(createdContact);
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
        result = JSON.parse(result);
        if(result && result.value && isValidCardCode(result.value)){
          return Client.update({CardCode: CardCode}, form);
        }
        return Promise.reject('Actualización en SAP fallida')
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
  },

  updateContact: function(req, res){
    var form = req.params.all();
    var contactCode = form.CntctCode;
    var cardCode = form.CardCode;
    form = mapContactFields(form);
    ClientContact.find({CardCode: cardCode, select:['CntctCode']})
      .then(function(contacts){
        var contactIndex = getContactIndex(contacts, contactCode);
        return SapService.updateContact(cardCode ,contactIndex, form);
      })
      .then(function(updatedSap){
        return ClientContact.update({CntctCode: contactCode}, form);
      })
      .then(function(updatedApp){
        res.json(updatedApp);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  createContact: function(req, res){
    var form = req.params.all();
    var cardCode = form.CardCode;
    form = mapContactFields(form);
    SapService.createContact(cardCode, form)
      .then(function(result){
        result = JSON.parse(result);
        if(!result.value || !isValidCardCode(result.value)){
          var err = result.value || 'Error al crear contacto';
          return Promise.reject(err);
        }
        form.CntctCode = result.value;
        return ClientContact.create(form);
      })
      .then(function(createdContact){
        res.json(createdContact);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  updateFiscalInfo: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    var id = form.id;
    delete form.AdresType;
    SapService.updateFiscalInfo(CardCode, form)
      .then(function(result){
        result = JSON.parse(result);
        if(!result.value){
          var err = result.value || 'Error al actualizar direccion fiscal';
          return Promise.reject(err);
        }
        return FiscalInfo.update({CardCode:CardCode}, form);
      })
      .then(function(updated){
        if(updated.err){
          return res.negotiate(err);
        }
        return res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }


};

function mapClientFields(fields){
  //Name
  fields.CardName = fields.firstName || fields.CardName;
  if(fields.firstName && fields.lastName){
    fields.CardName = fields.firstName + ' ' + fields.lastName;
  }
  fields.Phone1 = fields.phone || fields.Phone1;
  fields.Cellular = fields.mobilePhone || fields.Cellular;
  fields.E_Mail = fields.email || fields.E_Mail;
  return fields;
}

function mapContactFields(fields){
  fields.Tel1 = fields.phone || fields.Tel1;
  fields.Cellolar = fields.mobilePhone || fields.Cellolar;
  fields.Name = fields.Name || fields.FirstName;
  if(fields.LastName){
    fields.Name = fields.FirstName + ' ' + fields.LastName;
  }

  //fields.Address = fields.Address;
  fields.Address = '';
  var addressFields = [
    {key:'externalNumber', label: 'No. ext.'},
    {key:'internalNumber', label: 'No. int.'},
    {key:'neighborhood', label: 'Colonia'},
    {key:'municipality', label: 'Municipio'},
    {key:'city', label: 'Ciudad'},
    {key:'entity', label: 'Estado'},
    {key:'zipCode', label: 'C.P.'},
    {key:'street', label: 'Calle'},
    {key:'street2', label: 'Entre calle'},
    {key:'street3', label: 'Y calle'},
    {key:'references', label:'Referencias'}
  ];
  for(var key in fields){
    var af = _.findWhere(addressFields, {key:key});
    if( af ){
      fields.Address += af.label + ': ' + fields[key] + ', ';
    }
  }
  return fields;
}

function getContactIndex(contacts, contactCode){
  var contactCodes = contacts.map(function(c){
    return parseInt(c.CntctCode);
  });
  contactCodes = contactCodes.sort(function(a,b){
    return a - b;
  });
  return contactCodes.indexOf(contactCode);
}

function createContactPromise(params){
  var cardCode = params.CardCode;
  params = mapContactFields(params);
  return SapService.createContact(cardCode, params)
    .then(function(result){
      result = JSON.parse(result);
      if(!result.value){
        return {err: result};
      }
      params.CntctCode = result.value;
      return ClientContact.create(params);
    })
    .then(function(createdApp){
      return createdApp;
    })
    .catch(function(err){
      console.log('err createContactPromise');
      console.log(err);
    });
}

function createFiscalInfoPromise(params){
  var cardCode = params.CardCode;
  params.AdresType = 'S';
  return SapService.createFiscalInfo(cardCode,params)
    .then(function(result){
      return FiscalInfo.create(params);
    })
    .then(function(createdApp){
      return createdApp;
    })
    .catch(function(err){
      console.log(err);
    });
}

function isValidCardCode(cardCode){
  if(!cardCode){
    return false;
  }
  return cardCode.length <= 15;
}

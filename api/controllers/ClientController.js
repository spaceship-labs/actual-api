var _ = require('underscore');
var Promise = require('bluebird');
var ADDRESS_TYPE = 'S';

module.exports = {
  find: function(req, res){
    var form           = req.params.all();
    var model          = 'client';
    var extraParams = {
      searchFields: ['id','CardName','CardCode','firstName','lastName','E_Mail','phone']
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  findBySeller: function(req, res){
    var form = req.params.all();
    var model = 'client';
    var extraParams = {
      searchFields: ['CardCode','CardName'],
      populateFields: ['Quotations']
    };
    form.filters = {SlpCode: form.seller};
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      },function(err){
        console.log(err);
        res.notFound();
      });
  },

  findById: function(req, res){
    var form        = req.params.all();
    var id          = form.id;
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
      return FiscalAddress.findOne({CardCode: clientFound.CardCode, AdresType: ADDRESS_TYPE});
    })
    .then(function(fiscalAddress){
      clientFound.FiscalAddress = fiscalAddress;
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
    form                 = mapClientFields(form);
    form.User            = req.user.id;
    var contacts         = filterContacts(form.contacts);
    if(form.fiscalAddress && isValidFiscalAddress(form.fiscalAddress)){
      var fiscalAddress  = _.clone(form.fiscalAddress);
    }
    delete form.contacts;
    delete form.fiscalAddress;

    SapService.createClient(form)
      .then(function(result){
        sails.log.info('result createClient', result);
        if( !result.value || !isValidCardCode(result.value)  ) {
          var err = result.value || 'Error al crear socio de negocio';
          return Promise.reject(err);
        }
        form.CardCode = result.value;
        return Client.create(form);
      })
      .then(function(created){
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
        if(fiscalAddress){
          fiscalAddress.CardCode = createdContact.CardCode;
          return createFiscalAddressPromise(fiscalAddress);
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
    delete form.FiscalAddress;
    SapService.updateClient(CardCode, form)
      .then(function(result){
        sails.log.info('update client result', result);
        if(result && result.value && isValidCardCode(result.value)){
          return Client.update({CardCode: CardCode}, form);
        }
        return Promise.reject('Actualización en SAP fallida');
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
    ClientContact.find({CardCode:CardCode})
      .then(function(contacts){
        res.json(contacts);
      }).catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  createContact: function(req, res){
    var form = req.params.all();
    var cardCode = form.CardCode;
    SapService.createContact(cardCode, form)
      .then(function(result){
        sails.log.info('createContact result', result);
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

  updateContact: function(req, res){
    var form = req.params.all();
    var contactCode = form.CntctCode;
    var cardCode = form.CardCode;
    ClientContact.find({CardCode: cardCode, select:['CntctCode']})
      .then(function(contacts){
        var contactIndex = getContactIndex(contacts, contactCode);
        return SapService.updateContact(cardCode ,contactIndex, form);
      })
      .then(function(updatedSap){
        sails.log.info('result updateContact', updatedSap);
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

  createFiscalAddress: function(req, res){
    var form = req.params.all();
    var cardCode = form.CardCode;
    SapService.createFiscalAddress(cardCode, form)
      .then(function(result){
        sails.log.info('result createFiscalAddress');
        if(!result.value || !isValidCardCode(result.value)){
          var err = result.value || 'Error al crear direccion fiscal';
          return Promise.reject(err);
        }
        form.AdresType = ADDRESS_TYPE;
        return FiscalAddress.create(form);
      })
      .then(function(createdFiscalAddress){
        res.json(createdFiscalAddress);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  updateFiscalAddress: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    var id = form.id;
    delete form.AdresType;
    SapService.updateFiscalAddress(CardCode, form)
      .then(function(result){
        sails.log.info('result updateFiscalAddress', result);
        if(!result.value){
          var err = result.value || 'Error al actualizar direccion fiscal';
          return Promise.reject(err);
        }
        form.AdresType = ADDRESS_TYPE;
        return FiscalAddress.update({CardCode:CardCode}, form);
      })
      .then(function(updated){
        return res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getEwalletByClient: function(req, res){
    var form = req.allParams();
    var id = form.id;
    Client.findOne({id:id, select:['ewallet']})
      .then(function(client){
        res.json(client.ewallet);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }


};

function mapClientFields(fields){
  fields.CardName = fields.FirstName || fields.CardName;
  if(fields.FirstName && fields.LastName){
    fields.CardName = fields.FirstName + ' ' + fields.LastName;
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
  return SapService.createContact(cardCode, params)
    .then(function(result){
      sails.log.info('result createdContact promise', result);
      if(!result.value){
        return {err: result};
      }
      params.CntctCode = result.value;
      return ClientContact.create(params);
    })
    .then(function(createdInApp){
      return createdInApp;
    })
    .catch(function(err){
      console.log('err createContactPromise');
      console.log(err);
      return Promise.reject(err);
    });
}

function createFiscalAddressPromise(params){
  var cardCode = params.CardCode;
  params.AdresType = ADDRESS_TYPE;
  return SapService.createFiscalAddress(cardCode,params)
    .then(function(result){
      sails.log.info('result createFiscalAddress', result);
      return FiscalAddress.create(params);
    })
    .then(function(createdInApp){
      return createdInApp;
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

function filterContacts(contacts){
  var filteredContacts = (contacts || []).filter(function(contact){
    return !_.isUndefined(contact.FirstName);
  });
  return filteredContacts;
}

function isValidFiscalAddress(fiscalAddress){
  return !_.isUndefined(fiscalAddress.companyName);
}

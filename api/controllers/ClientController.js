var _       = require('underscore');
var moment  = require('moment');
var Promise = require('bluebird');
var ADDRESS_TYPE = 'S';

module.exports = {
  find: function(req, res){
    var form           = req.params.all();
    var model          = 'client';
    var extraParams = {
      searchFields: [
        'id',
        'CardName',
        'CardCode',
        'firstName',
        'lastName',
        'E_Mail',
        'phone'
      ]
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
    var createdClient  = false;
    var contacts       = [];
    var params         = {};

    var fiscalAddress  = {};

    if (email && email.match(actualMail)) {
      return res.badRequest({
        error: 'user could not be created with an employee\'s mail'
      });
    }
    form               = ClientService.mapClientFields(form);
    form.User          = req.user.id;
    contacts           = ClientService.filterContacts(form.contacts);
    contacts           = contacts.map(ClientService.mapContactFields);

    if(form.fiscalAddress && ClientService.isValidFiscalAddress(form.fiscalAddress)){
      fiscalAddress  = _.clone(form.fiscalAddress);
      fiscalAddress  = ClientService.mapFiscalFields(fiscalAddress);
    }
   
    delete form.contacts;
    delete form.fiscalAddress;

    params = {
      client: form,
      fiscalAddress: fiscalAddress,
      clientContacts: contacts
    };

    SapService.createClient(params)
      .then(function(result){
        sails.log.info('result createClient', result);
        var sapData = JSON.parse(result.value);

        if( !sapData || !ClientService.isValidCardCode(sapData.CardCode)  ) {
          var err = result.value || 'Error al crear socio de negocio';
          return Promise.reject(err);
        }
        
        form.CardCode     = sapData.CardCode;
        form.BirthDate    = moment(form.BirthDate).toDate();
        var contactCodes  = sapData.pers;
        contacts          = contacts.map(function(contact, i){
          contact.CntctCode = contactCodes[i];
          contact.CardCode  = form.CardCode;
          return contact;
        });

        return Client.create(form);
      })
      .then(function(created){
        createdClient = created;
        var promises = [];

        if(contacts && contacts.length > 0){
          sails.log.info('contacts', contacts);
          promises.push(ClientContact.create(contacts));
        }

        //Created automatically
        if(fiscalAddress){
          fiscalAddress           = ClientService.mapFiscalFields(fiscalAddress);
          fiscalAddress.CardCode  = createdClient.CardCode;
          fiscalAddress.AdresType = ADDRESS_TYPE;
          promises.push(FiscalAddress.create(fiscalAddress));
        }

        if(promises.length > 0){
          return promises;
        }else{
          //Returning empty promise
          return new Promise(function(resolve, reject){
            resolve();
          });
        
        }

      })
      .spread(function(contactsCreated, fiscalAddressCreated){
        sails.log.info('contactsCreated', contactsCreated);
        sails.log.info('fiscalAddressCreated', fiscalAddressCreated);
        
        res.json(createdClient);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  update: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    form = ClientService.mapClientFields(form);
    delete form.FiscalAddress;
    SapService.updateClient(CardCode, form)
      .then(function(resultSap){
        sails.log.info('update client resultSap', resultSap);
        if(resultSap && resultSap.value && ClientService.isValidCardCode(resultSap.value)){
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
    form = ClientService.mapContactFields(form);    
    SapService.createContact(cardCode, form)
      .then(function(resultSap){
        sails.log.info('createContact resultSap', resultSap);
        if( !resultSap.value || !_.isArray(resultSap.value) ){
          var err = resultSap.value || 'Error al crear contacto';
          return Promise.reject(err);
        }
        var CntctCode  = resultSap.value[0]; 
        if(!ClientService.isValidContactCode(CntctCode)){
          var err = resultSap.value || 'Error al crear contacto';
          return Promise.reject(err);
        }

        form.CntctCode = CntctCode;
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
    form = ClientService.mapContactFields(form);
    ClientContact.find({CardCode: cardCode, select:['CntctCode']})
      .then(function(contacts){
        var contactIndex = ClientService.getContactIndex(contacts, contactCode);
        return SapService.updateContact(cardCode ,contactIndex, form);
      })
      .then(function(resultSap){
        sails.log.info('resultSap updateContact', resultSap);
        if( !resultSap.value || !_.isArray(resultSap.value) ){
          var err = resultSap.value || 'Error al actualizar contacto';
          return Promise.reject(err);
        }
        var CntctCode  = resultSap.value[0]; 
        if(!ClientService.isValidContactCode(CntctCode)){
          var err = resultSap.value || 'Error al actualizar contacto';
          return Promise.reject(err);
        }
        return ClientContact.update({CntctCode: contactCode}, form);
      })
      .then(function(updatedApp){
        sails.log.info('contact updatedApp', updatedApp);
        res.json(updatedApp);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  /*
  createFiscalAddress: function(req, res){
    var form = req.params.all();
    var cardCode = form.CardCode;
    var fiscalAddress = ClientService.mapFiscalFields(form);
    SapService.createFiscalAddress(cardCode, fiscalAddress)
      .then(function(result){
        sails.log.info('result createFiscalAddress');
        if(!result.value || !ClientService.isValidCardCode(result.value)){
          var err = result.value || 'Error al crear direccion fiscal';
          return Promise.reject(err);
        }
        fiscalAddress.AdresType = ADDRESS_TYPE;
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
  */

  updateFiscalAddress: function(req, res){
    var form = req.params.all();
    var CardCode = form.CardCode;
    var id = form.id;
    var fiscalAddress = ClientService.mapFiscalFields(form);
    delete form.AdresType;
    if(!form.LicTradNum || !ClientService.isValidRFC(form.LicTradNum)){
      var err = new Error('RFC no valido');
      return res.negotiate(err);
    }
    SapService.updateFiscalAddress(CardCode, fiscalAddress)
      .then(function(result){
        sails.log.info('result updateFiscalAddress', result);
        if(!result.value){
          var err = result.value || 'Error al actualizar direccion fiscal';
          return Promise.reject(err);
        }
        return [
          FiscalAddress.update({CardCode:CardCode}, fiscalAddress),
          Client.update({CardCode: CardCode}, {LicTradNum: form.LicTradNum})
        ];
      })
      .spread(function(fiscalAddressUpdated){
        sails.log.info('updated in sails fiscalAddress', fiscalAddressUpdated);
        return res.json(fiscalAddressUpdated);
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


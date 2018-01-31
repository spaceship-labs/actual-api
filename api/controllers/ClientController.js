var _ = require('underscore');
var moment = require('moment');
var Promise = require('bluebird');
var ADDRESS_TYPE_S = 'S';
var ADDRESS_TYPE_B = 'B';

module.exports = {
  find: function(req, res) {
    var form = req.params.all();
    var model = 'client';
    var extraParams = {
      searchFields: [
        'id',
        'CardName',
        'CardCode',
        'firstName',
        'lastName',
        'E_Mail',
        'phone',
      ],
    };
    Common.find(model, form, extraParams)
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  findBySeller: function(req, res) {
    var form = req.params.all();
    var model = 'client';
    var extraParams = {
      searchFields: ['CardCode', 'CardName'],
      populateFields: ['Quotations'],
    };
    form.filters = { SlpCode: form.seller };
    Common.find(model, form, extraParams).then(
      function(result) {
        res.ok(result);
      },
      function(err) {
        console.log(err);
        res.notFound();
      }
    );
  },

  async findById(req, res) {
    try {
      const id = req.param('id');
      const client = await Client.findOne({ id });
      const Contacts = await ClientContact.find({ CardCode: client.CardCode });
      const query = {
        CardCode: client.CardCode,
        AdresType: ClientService.ADDRESS_TYPE,
      };
      const fiscalAddress = await FiscalAddress.findOne({
        CardCode: client.CardCode,
        AdresType: ClientService.ADDRESS_TYPE,
      });
      const response = { 
        ...client,
        Contacts, 
        FiscalAddress: fiscalAddress 
      };
      res.ok(response);
    } catch (err) {
      res.negotiate(err);
    }
  },

  async create(req, res) {
    var form = req.allParams();
    try{
      var {
        createdClient, 
        contactsCreated, 
        fiscalAddressesCreated
      } = await ClientService.createClient(form, req);

      if(contactsCreated && contactsCreated.length > 0){
        sails.log.info('contacts created', contactsCreated);
        createdClient = Object.assign(createdClient ,{
          Contacts: contactsCreated
        });
      }

      return res.json(createdClient);
    }
    catch(e){
      return res.negotiate(e);
    }
  },

  async update(req, res){
    var form = req.allParams();
    try{
      const updatedClient = await ClientService.updateClient(form, req)
      res.json(updatedClient);
    }
    catch(err){
      console.log(err);
      res.negotiate(err);
    }
  },

  getContactsByClient: function(req, res) {
    var form = req.params.all();
    var CardCode = form.CardCode;
    ClientContact.find({ CardCode: CardCode })
      .then(function(contacts) {
        res.json(contacts);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  async createContact(req, res){
    var form = req.allParams();
    var CardCode = form.CardCode;
    try{
      const createdContact = await ContactService.createContact(form, CardCode);
      res.json(createdContact);
    }catch(err){
      console.log('err', err);
      res.negotiate(err);
    }
  },

  async updateContact(req, res) {
    var form = req.allParams();
    try{
      const updatedContact = await ContactService.updateContact(form);
      res.json(updatedContact);
    }catch(err){
      res.negotiate(err);
    }
  },

  async updateFiscalAddress(req, res){
    var form = req.allParams();
    try{
      const updatedFiscalAddress = await FiscalAddressService.updateFiscalAddress(form);
      res.json(updatedFiscalAddress);
    }catch(err){
      res.negotiate(err);
    }
  },

  getEwalletByClient: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    Client.findOne({ id: id, select: ['ewallet'] })
      .then(function(client) {
        res.json(client.ewallet);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getClientBalance: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var client;
    ClientBalanceService.getClientBalanceById(id)
      .then(function(balance) {
        res.json(balance);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },
};

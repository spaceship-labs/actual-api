var _ 			= require('underscore');
var moment  = require('moment');
var ADDRESS_TYPE 		= 'S';
var CLIENT_DATE_FORMAT = 'MM/DD/YYYY';

module.exports = {

	mapClientFields: function(fields){
	  fields.CardName = fields.FirstName || fields.CardName;
	  if(fields.FirstName && fields.LastName){
	    fields.CardName = fields.FirstName + ' ' + fields.LastName;
	  }
	  if(fields.Birthdate){
	  	fields.Birthdate = moment(fields.Birthdate).format(CLIENT_DATE_FORMAT);
	  }
	  return fields;
	},

	mapFiscalFields: function(fields){
		fields.Address = fields.companyName;
		fields.AdresType = ADDRESS_TYPE;
		return fields;
	},

	mapContactFields: function(fields){
	  fields.E_MailL = fields.E_Mail;
	  fields.Name = fields.FirstName;
	  if(fields.LastName){
	  	fields.Name += ' ' + fields.LastName;
	  }
	  return fields;
	},

	getContactIndex: function(contacts, contactCode){
	  if(contacts.length === 1){
	  	return 0;
	  }
	  var contactCodes = contacts.map(function(c){
	    return parseInt(c.CntctCode);
	  });
	  contactCodes = contactCodes.sort(function(a,b){
	    return a - b;
	  });
	  return contactCodes.indexOf(contactCode);
	},

 	isValidCardCode: function(cardCode){
	  if(!cardCode){
	    return false;
	  }
	  return cardCode.length <= 15;
	},

	filterContacts: function(contacts){
	  var filteredContacts = (contacts || []).filter(function(contact){
	    return !_.isUndefined(contact.FirstName);
	  });
	  return filteredContacts;
	},

	isValidFiscalAddress: function(fiscalAddress){
	  return !_.isUndefined(fiscalAddress.companyName);
	}

};


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
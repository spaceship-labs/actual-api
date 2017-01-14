var _ 			= require('underscore');
var moment  = require('moment');
var ADDRESS_TYPE 		= 'S';
var CLIENT_DATE_FORMAT = 'MM/DD/YYYY';
var CARDCODE_TYPE = 'CardCode';
var ERROR_TYPE = 'Error';

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

 	isValidCardCode: isValidCardCode,

	filterContacts: function(contacts){
	  var filteredContacts = (contacts || []).filter(function(contact){
	    return !_.isUndefined(contact.FirstName);
	  });
	  return filteredContacts;
	},

	isValidFiscalAddress: function(fiscalAddress){
	  return !_.isUndefined(fiscalAddress.companyName);
	},

	isValidRFC: function(rfc){
		return rfc.length === 12 || rfc.length === 13;
	},

	isValidContactCode: function(contactCode){
		return !isNaN(contactCode);
	},

	isValidSapClientCreation(sapData, contacts, fiscalAddress){
		var result = {error:true};
		if(sapData.type === ERROR_TYPE){
			result = {error: sapData.result || true};
		}
		
		if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result) && _.isArray(sapData.pers) ){
			if(contacts.length === sapData.pers.length){
				result = {error: false};
			}
		}
		
		return result;
	},

	isValidSapClientUpdate(sapData){
		var result = {error:true};
		if(sapData.type === ERROR_TYPE){
			result = {error: sapData.result || true};
		}
		
		if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result) ){
			result = {error: false};
		}
		
		return result;
	},

	isValidSapFiscalClientUpdate(sapData){
		var result = {error:true};
		if(sapData.type === ERROR_TYPE){
			result = {error: sapData.result || true};
		}
		
		if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result)  ){
			result = {error: false};
		}
		
		return result;
	},

	areContactsRepeated: function(contacts){
		contacts = contacts.map(mapContactFields);
		var contactsNames = contacts.map(function(contact){
			return contact.Name;
		});
		var areRepeated = contactsNames.some(function(contact, idx){ 
		    return contactsNames.indexOf(contact) != idx; 
		});		
		return areRepeated;
	},

	mapContactFields: mapContactFields

};

function isValidCardCode(cardCode){
	  if(!cardCode){
	    return false;
	  }
	  return cardCode.length <= 15;
}

function isValidContact(contact){
	return true;
}


function mapContactFields(fields){
  fields.E_MailL = fields.E_Mail;
  fields.Name = fields.FirstName;
  if(fields.LastName){
  	fields.Name += ' ' + fields.LastName;
  }
  return fields;
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
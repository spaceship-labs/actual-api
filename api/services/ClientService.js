const _ = require('underscore');
const moment = require('moment');
const Promise = require('bluebird');
const ADDRESS_TYPE = 'B';
const CLIENT_DATE_FORMAT = 'MM/DD/YYYY';
const CARDCODE_TYPE = 'CardCode';
const PERSON_TYPE = 'Person';
const ERROR_TYPE = 'Error';
const ACTUAL_EMAIL_DOMAIN = /@actualgroup.com$/;

module.exports = {
  ADDRESS_TYPE,
  CARDCODE_TYPE,
  PERSON_TYPE,
  ERROR_TYPE,
	createClient,
	updateClient,  
  areContactsRepeated,
  filterContacts,
  getContactIndex,
  isValidContactCode,
  isValidFiscalAddress,
  isValidRFC,
	validateSapClientCreation,
	validateSapClientUpdate,
  mapClientFields,
  mapContactFields,
  mapFiscalFields,
  isValidCardCode,
};

function mapClientFields(fields) {
  fields.CardName = fields.FirstName || fields.CardName;
  if (fields.FirstName && fields.LastName) {
    fields.CardName = fields.FirstName + ' ' + fields.LastName;
  }
  if (fields.Birthdate) {
    fields.Birthdate = moment(fields.Birthdate).format(CLIENT_DATE_FORMAT);
  }
  return fields;
}

function mapFiscalFields(fields) {
  fields.Address = fields.companyName;
  fields.AdresType = ADDRESS_TYPE;
  return fields;
}

function getContactIndex(contacts, contactCode) {
  if (contacts.length === 1) {
    return 0;
  }
  var contactCodes = contacts.map(function(c) {
    return parseInt(c.CntctCode);
  });
  contactCodes = contactCodes.sort(function(a, b) {
    return a - b;
  });
  return contactCodes.indexOf(contactCode);
}

function filterContacts(contacts) {
  var filteredContacts = (contacts || []).filter(function(contact) {
    return !_.isUndefined(contact.FirstName);
  });
  return filteredContacts;
}

function isValidFiscalAddress(fiscalAddress) {
  return !_.isUndefined(fiscalAddress.companyName);
}

function isValidRFC(rfc) {
  return rfc.length === 12 || rfc.length === 13;
}

function isValidContactCode(contactCode) {
  return !isNaN(contactCode);
}

function validateSapClientCreation(sapData, sapContactsParams){
	if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result) && _.isArray(sapData.pers) ){
		if(sapContactsParams.length === sapData.pers.length){
			return true;
		}
	}
	if(sapData.type === ERROR_TYPE){
		throw new Error(sapData.result);
	}	
	throw new Error('Error al crear cliente en SAP');
}

function validateSapClientUpdate(sapData){
	if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result) ){
		return true;
	}
	if(sapData.type === ERROR_TYPE){
		throw new Error(sapData.result);
	}	
	throw new Error('Error al actualizar datos personales en SAP');
}

function areContactsRepeated(contacts) {
  contacts = contacts.map(mapContactFields);
  var contactsNames = contacts.map(function(contact) {
    return contact.Name;
  });
  var areRepeated = contactsNames.some(function(contact, idx) {
    return contactsNames.indexOf(contact) != idx;
  });
  return areRepeated;
}

function isValidCardCode(cardCode) {
  if (!cardCode) {
    return false;
  }
  return cardCode.length <= 15;
}

function mapContactFields(fields) {
  fields.E_MailL = fields.E_Mail;
  fields.Name = fields.FirstName;
  if (fields.LastName) {
    fields.Name += ' ' + fields.LastName;
  }
  return fields;
}


async function createClient(params, req){
	var sapFiscalAddressParams = {};
	var sapContactsParams = [];
	var contactsCreated = [];
	var fiscalAddressesCreated = [];
	const email = params.E_Mail;
	try{
    if(!email){	
			throw new Error('Email requerido');
		}
    if(email && email.match(ACTUAL_EMAIL_DOMAIN)){
			throw new Error('Email no valido');
		}
    if(params.LicTradNum && !isValidRFC(params.LicTradNum)){
			throw new Error('RFC no valido');
    }

    const createParams = mapClientFields(params);
    const filteredContacts = filterContacts(createParams.contacts);
    sapContactsParams = filteredContacts.map(mapContactFields);
    
    if(sapContactsParams.length > 0 && areContactsRepeated(sapContactsParams)){
			throw new Error('Nombres de contactos repetidos');
    }

    if(params.fiscalAddress && isValidFiscalAddress(params.fiscalAddress)){
      const fiscalAddressAux  = _.clone(params.fiscalAddress);
      sapFiscalAddressParams  = mapFiscalFields(fiscalAddressAux);
    }

    //Seller assign
    params.User = req.user.id;
    const sapClientParams = _.clone(params);
    var sapCreateParams = {
      client: sapClientParams,
      fiscalAddress: sapFiscalAddressParams || {},
      clientContacts: sapContactsParams,
      activeStore: req.activeStore
    };


    const isClientEmailTaken = await Client.findOne({ E_Mail: email });
    if(isClientEmailTaken){
			throw new Error('Email previamente utilizado');
		}      
		
		const sapResult = await SapService.createClient(sapCreateParams);
		sails.log.info('SAP result createClient', sapResult);
		const sapData = JSON.parse(sapResult.value);
		if(!sapData){
			throw new Error('Error al crear cliente en SAP');	
		}
		
		validateSapClientCreation(
			sapData, 
			sapContactsParams, 
			sapFiscalAddressParams
		);
	
		const clientCreateParams = Object.assign(sapClientParams,{
			CardCode: sapData.result,
			BirthDate: moment(sapClientParams.BirthDate).toDate()
		});

		const contactCodes = sapData.pers;
		const contactsParams = sapContactsParams.map(function(c, i){
			c.CntctCode = contactCodes[i];
			c.CardCode = clientCreateParams.CardCode;
		});

		sails.log.info('contacts app', contactsParams);
		sails.log.info('client app', clientCreateParams);
		
		const createdClient = await Client.create(clientCreateParams);

		if(contactsParams && contactsParams.length > 0){
			contactsCreated = await ClientContact.create(contactsParams);
		}

		//Created automatically, do we need the if validation?
		//if(sapFiscalAddressParams){
			var fiscalAddressParams = mapFiscalFields(sapFiscalAddressParams);
			fiscalAddressParams = Object.assign(fiscalAddressParams, {
				CardCode: createdClient.CardCode,
				AdresType: ADDRESS_TYPE_S
			});

			var fiscalAddressParams2 = Object.assign(fiscalAddressParams,{
				AdresType: ADDRESS_TYPE_B
			});

			fiscalAddressesCreated = await FiscalAddress.create([
				fiscalAddressParams,
				fiscalAddressParams2
			]);
		//}

		if(fiscalAddressesCreated){
			sails.log.info('fiscal adresses created', fiscalAddressesCreated);
		}

		return {
			createdClient: updatedClient, 
			contactsCreated, 
			fiscalAddressesCreated
		};
	}
	catch(err){
		throw new Error(err);
	}
}

async function updateClient(params, req){
	const CardCode = _.clone(req.user.CardCode);
	const email = params.E_Mail;
	const userId = req.user ? req.user.id : false;
	
	delete params.FiscalAddress;
	delete params.Balance;
	delete params.Orders;
	delete params.Quotations;

	const updateParams = mapClientFields(params);
	try{
		if(!email){
			throw new Error('Email requerido');
		}
		if(!userId){
			throw new Error('No autorizado');
		}
		const isClientEmailTaken = await Client.findOne({E_Mail:email, id: {'!=': params.id}});
    if(isClientEmailTaken){	
			throw new Error('Email previamente utilizado');
		}
		sails.log.info('updateParams', updateParams);
		const sapResult = await SapService.updateClient(CardCode, params);
		sails.log.info('update client resultSap', sapResult);
		var sapData = JSON.parse(sapResult.value);

		validateSapClientUpdate(sapData);

		const updatedClients = Client.update({CardCode: CardCode}, params);
		const updatedClient = updatedClients[0];
    return updatedClient;
  }
	catch(err){
		throw new Error(err);
	}

}
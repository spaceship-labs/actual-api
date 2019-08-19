const _ = require('underscore');
var EWALLET_NEGATIVE = 'negative';
var EWALLET_TYPE = 'ewallet';
var Promise = require('bluebird');
const moment = require('moment');

const customFind = async (params, extraParams, modelToFind) => {
  console.log('extraParams', extraParams);
  console.log('params', params);

  const searchFields = extraParams.searchFields || [];
  const selectedFields = extraParams.selectedFields || [];
  const items = params.items || 10;
  const page = params.page || 1;
  const term = params.term;
  const orderBy = params.orderby;
  let query = {};
  let querySearchAux = {};
  let model = sails.models[modelToFind];
  const filters = params.filters;
  const selectObj = false;
  let read = false;
  const getAll = params.getAll;
  const dateRange = params.dateRange;
  const keywords = params.keywords;

  if (term) {
    if (searchFields.length > 0) {
      query.or = [];
      for (let i = 0; i < searchFields.length; i++) {
        let field = searchFields[i];
        let obj = {};
        obj[field] = { contains: term };
        query.or.push(obj);
      }
    }
  }

  if (keywords) {
    if (searchFields.length > 0) {
      query.or = [];
      searchFields.forEach(field => {
        keywords.forEach(keyword => {
          let obj = {};
          obj[field] = { contains: keyword };
          query.or.push(obj);
        });
      });
    }
  }

  if (filters) {
    for (const key in filters) {
      query[key] = filters[key];
    }
  }

  if (dateRange) {
    let startDate, endDate;
    query[dateRange.field] = {};

    if (dateRange.start) {
      startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      query[dateRange.field] = Object.assign(query[dateRange.field], {
        '>=': new Date(startDate),
      });
    }
    if (dateRange.end) {
      endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      query[dateRange.field] = Object.assign(query[dateRange.field], {
        '<=': new Date(endDate),
      });
    }
    if (_.isEmpty(query[dateRange.field])) {
      delete query[dateRange.field];
    }
  }

  querySearchAux = { ...query };

  if (!getAll) {
    query.skip = (page - 1) * items;
    query.limit = items;
  }
  console.log('query', query);

  read = model.find(query);
  console.log('modelToFind', modelToFind);

  read = read.populate(
    modelToFind === 'ewallet'
      ? ['Client', 'Store', 'Contract']
      : modelToFind === 'ewalletreplacement'
        ? ['Client', 'Store', 'requestedBy', 'Files']
        : ['Store', 'Ewallet']
  );

  if (orderBy) {
    read.sort(orderBy);
  }
  const results = await read;
  console.log('results', results);

  const total = await model.count(querySearchAux);

  return { data: results, total };
};

const validateExpirationDate = async () => {
  const ewalletConf = await EwalletConfiguration.find();
  const ewalletConfiguration = ewalletConf[0];
  if (!ewalletConfiguration) {
    return;
  } else if (ewalletConfiguration) {
    const monthBeforeExpiration = moment(ewalletConfiguration.expirationDate)
      .subtract(1, 'months')
      .format('MM');
    const currentMonth = moment(ewalletConfiguration.expirationDate).format(
      'MM'
    );

    if (
      monthBeforeExpiration === currentMonth &&
      ewalletConfiguration.emailSent === false
    ) {
      const clients = await Client.find();
      const clientsEmail = clients
        .filter(function(client) {
          if (client.Ewallet) {
            return client;
          }
        })
        .map(function(client) {
          return { email: client.E_Mail, name: client.CardName };
        });
      const status = clientsEmail.map(email => {
        Email.sendEwalletPointsWarning(email);
      });
      await EwalletConfiguration.update(
        { id: ewalletConfiguration.id },
        { emailSent: true }
      );
    }
    const expirationDate = moment(ewalletConfiguration.expirationDate).format(
      'YYYY-MM-DD HH:mm'
    );
    const today = moment(new Date()).format('YYYY-MM-DD HH:mm');
    if (today >= expirationDate) {
      const ewallets = await Ewallet.find();
      const ids = ewallets.map(ewallet => ewallet.id);
      const newExpirationDate = moment(ewalletConfiguration.expirationDate).add(
        1,
        'years'
      );
      await Ewallet.update({ id: ids }, { amount: 0 });
      await EwalletConfiguration.update(
        { id: ewalletConfiguration.id },
        { expirationDate: newExpirationDate }
      );
    }
    return;
  }
};

const getExchangeRate = async () => {
  const ewalletConfiguration = await EwalletConfiguration.find();
  return ewalletConfiguration[0].exchangeRate;
};

module.exports = {
  getExchangeRate,
  customFind: customFind,
  applyEwalletRecord: applyEwalletRecord,
  isValidEwalletPayment: isValidEwalletPayment,
  validateExpirationDate: validateExpirationDate,
};

function isValidEwalletPayment(paymentAmount, ewalletAmount) {
  console.log('COMPARITION EWALLET AMOUNT: ', ewalletAmount);
  console.log('COMPARITION PAYMENT AMOUNT: ', paymentAmount);
  if (ewalletAmount < paymentAmount || !ewalletAmount) {
    return false;
  }
  return true;
}

async function applyEwalletRecord(payment, options, ewalletAmount, ewalletId) {
  if (ewalletAmount < payment.ammount || !ewalletAmount) {
    return Promise.reject(
      new Error('Fondos insuficientes en monedero electronico')
    );
  }
  const updatedAmount = ewalletAmount - payment.ammount;
  console.log('updatedAmount: ', updatedAmount);
  console.log('ewalletAmount: ', ewalletAmount);
  console.log('payment.ammount: ', payment.ammount);
  console.log('ewalletId: ', ewalletId);
  if (payment.type == EWALLET_TYPE) {
    const ewalletRecordParams = {
      Store: payment.Store,
      Quotation: options.quotationId,
      User: options.userId,
      Payment: options.paymentId,
      Ewallet: ewalletId,
      movement: 'decrease',
      amount: payment.ammount,
    };

    const { id } = await EwalletRecord.create(ewalletRecordParams);

    const ewallet = await Ewallet.update(
      { id: ewalletId },
      { EwalletRecord: id, amount: updatedAmount }
    );
    console.log('EWALLET FINAL: ', ewallet);
  } else {
    return null;
  }
}

const _ = require('underscore');
const Promise = require('bluebird');
const BigNumber = require('bignumber.js');
const INVOICE_SAP_TYPE = 'Invoice';
const ORDER_SAP_TYPE = 'Order';
const ERROR_SAP_TYPE = 'Error';
const BALANCE_SAP_TYPE = 'Balance';
const statusTypes = {
  CANCELED: 'canceled',
  PAID: 'paid',
};

const validateifOrderExists = orderId => {
  const frontUrl = process.env.baseURLFRONT || 'http://ventas.miactual.com';
  const orderUrl = frontUrl + '/checkout/order/' + orderId;
  throw new Error(
    'Ya se ha creado un pedido sobre esta cotización : ' + orderUrl
  );
};

module.exports = {
  async create(quotationId, ewallet, currentUser) {
    const currentStore = currentUser.activeStore;

    const previousOrder = await Order.findOne({ Quotation: quotationId });
    //Validating if quotation doesnt have an order assigned
    if (previousOrder) {
      validateifOrderExists(previousOrder.id);
    }
    const isValidStock = await StockService.validateQuotationStockById(
      quotationId,
      currentUser.activeStore
    );
    const quotationPayments = await Payment.find({
      Quotation: quotationId,
    }).sort('createdAt ASC');

    if (!isValidStock) {
      throw new Error('Inventario no suficiente para crear la orden');
    }
    const opts = {
      //paymentGroup: form.paymentGroup || 1,
      updateDetails: true,
      currentStoreId: currentUser.activeStore.id,
      paymentGroup: QuotationService.getGroupByQuotationPayments(
        quotationPayments
      ),
    };

    const calculator = QuotationService.Calculator();

    await calculator.updateQuotationTotals(quotationId, opts);

    const quotation = await Quotation.findOne({ id: quotationId })
      .populate('Payments')
      .populate('Details')
      .populate('Address')
      .populate('User')
      .populate('Client')
      .populate('Broker')
      .populate('EwalletRecords');

    if (!quotation.Client) {
      throw new Error('No hay un cliente asociado a esta cotización');
    }

    if (
      quotation.Client.LicTradNum &&
      !ClientService.isValidRFC(quotation.Client.LicTradNum)
    ) {
      throw new Error('El RFC del cliente no es valido');
    }

    const fiscalAddress = await FiscalAddress.findOne({
      CardCode: quotation.Client.CardCode,
    });

    if (!fiscalAddress) {
      throw new Error('No hay una dirección fiscal asociada al cliente');
    }

    //Validating if quotation doesnt have an order assigned
    if (quotation.Order) {
      await validateifOrderExists(quotation.Order.id);
    }

    if (!quotation.Details || quotation.Details.length === 0) {
      throw new Error('No hay productos en esta cotización');
    }

    const minPaidPercentage = quotation.minPaidPercentage || 100;
    if (
      getPaidPercentage(quotation.ammountPaid, quotation.total) <
      minPaidPercentage
    ) {
      throw new Error('No se ha pagado la cantidad minima de la orden');
    }

    const user = await User.findOne({ id: quotation.User.id }).populate(
      'Seller'
    );

    if (!user) {
      throw new Error('Esta cotización no tiene un vendedor asignado');
    }

    var orderParams = buildOrderCreateParams({
      user,
      quotation,
      currentStore,
      client: quotation.Client,
      payments: quotation.Payments,
      address: quotation.Address,
      clientBalanceRecords: Quotation.ClientBalanceRecords,
      ewalletRecords: quotation.EwalletRecords,
      broker: quotation.Broker,
    });

    const quotationDetails = await QuotationDetail.find({
      Quotation: quotation.id,
    }).populate('Product');
    const site = await Site.findOne({ handle: 'actual-group' });

    const sapSaleOrderParams = {
      quotationId,
      groupCode: orderParams.groupCode,
      cardCode: orderParams.CardCode,
      slpCode: orderParams.SlpCode,
      cntctCode: orderParams.CntctCode,
      payments: quotation.Payments,
      exchangeRate: site.exchangeRate,
      currentStore: currentStore,
      quotationDetails: quotationDetails,
      brokerCode: quotation.Broker ? quotation.Broker.Code : null,
    };

    const {
      response,
      endPoint,
      requestParams,
    } = await SapService.createSaleOrder(sapSaleOrderParams);
    const sapResponse = response;
    const sapEndpoint = decodeURIComponent(endPoint);
    sails.log.info('createSaleOrder response', sapResponse);

    const logToCreate = {
      content:
        sapEndpoint +
        '\n' +
        JSON.stringify(requestParams) +
        '\n' +
        JSON.stringify(sapResponse),
      User: currentUser.id,
      Store: opts.currentStoreId,
      Quotation: quotationId,
    };

    const sapLog = await SapOrderConnectionLog.create(logToCreate);

    const sapResult = JSON.parse(sapResponse.value);

    validateSapOrderCreated(sapResponse, sapResult, quotation.Payments);

    orderParams.documents = sapResult;
    orderParams.SapOrderConnectionLog = sapLog.id;

    const orderCreated = await Order.create(orderParams);
    const orderFound = await Order.findOne({ id: orderCreated.id }).populate(
      'Details'
    );

    //Cloning quotation details to order details
    quotation.Details.forEach(function(detail) {
      detail.QuotationDetail = _.clone(detail.id);
      delete detail.id;
      orderFound.Details.add(detail);
    });
    await orderFound.save();
    const orderDetails = await OrderDetail.find({ Order: orderCreated.id })
      .populate('Product')
      .populate('shipCompanyFrom');

    const updateFields = {
      Order: orderCreated.id,
      status: 'to-order',
      isClosed: true,
      isClosedReason: 'Order created',
    };

    await Quotation.update({ id: quotation.id }, updateFields);
    await saveSapReferences(sapResult, orderCreated, orderDetails);
    if (ewallet) {
      const ewalletProcessBalanceParams = {
        details: quotation.Details,
        storeId: opts.currentStoreId,
        orderId: orderCreated.id,
        quotationId: quotation.id,
        userId: quotation.User.id,
        ewalletId: ewallet,
      };

      await processEwalletBalance(ewalletProcessBalanceParams);
    }

    const order = orderCreated.toObject();
    order.Details = orderDetails;
    return order;
  },
  cancel,
  getCountByUser,
  getTotalsByUser,
  validateSapOrderCreated,
  collectSapErrors,
  collectSapErrorsBySapOrder,
  checkIfSapOrderHasReference,
  checkIfSapOrderHasPayments,
  everyPaymentIsClientBalanceOrCredit,
  extractBalanceFromSapResult,
  getPaidPercentage,
  buildOrderCreateParams,
  statusTypes,
  isCanceled,
};

const processEwalletBalance = async ({
  storeId,
  orderId,
  quotationId,
  details,
  userId,
  ewalletId,
}) => {
  const ewalletConfigurationFound = await EwalletConfiguration.find();
  const ewalletConfiguration = ewalletConfigurationFound[0];
  if (ewalletConfiguration) {
    console.log('ENTRA BALANCE ewalletConfiguration: ');
    const { total, Payments } = await Order.findOne({ id: orderId }).populate(
      'Payments'
    );
    console.log('ORDER PAYMENTS: ', Payments);
    const paymentsIds = Payments.map(payment => payment.id);
    const payments = await Payment.find({ id: paymentsIds });
    console.log('EWALLET ORDER PAYMENT: ', payments);
    const ewalletPayment = payments.map(payment => {
      console.log('PAYMENT IN MAP: ', payment);
      console.log('TYPE PAYMENT IN MAP: ', payment.type);
      if (payment.type === 'ewallet') {
        return payment.ammount;
      } else {
        return 0;
      }
    });
    console.log('ewalletPayment: ', ewalletPayment);
    const amountPayed = ewalletPayment.reduce(
      (total, amount) => total + amount,
      0
    );
    console.log('amountPayed: ', amountPayed);
    const amountExceeded = validatePromoPercentageAmount(
      amountPayed >= 0 ? amountPayed : 0,
      total,
      ewalletConfiguration
    );
    console.log('amountExceeded: ', amountExceeded);
    if (amountExceeded) {
      return;
    } else {
      await generateEwalletBalanceAndRecords(
        storeId,
        orderId,
        quotationId,
        details,
        userId,
        ewalletId
      );
    }
  } else {
    await generateEwalletBalanceAndRecords(
      storeId,
      orderId,
      quotationId,
      details,
      userId,
      ewalletId
    );
  }
};

const generateEwalletBalanceAndRecords = async (
  storeId,
  orderId,
  quotationId,
  details,
  userId,
  ewalletId
) => {
  let ewalletRecords = [];
  let generated = 0;
  for (let i = 0; i < details.length; i++) {
    generated += details[i].ewallet || 0;
    if ((details[i].ewallet || 0) > 0) {
      ewalletRecords.push({
        Store: storeId,
        Order: orderId,
        Quotation: quotationId,
        QuotationDetail: details[i].id,
        User: userId,
        Ewallet: ewalletId,
        amount: details[i].ewallet,
        movement: 'increase',
      });
    }
  }

  const ewalletRecordsCreated = await Promise.each(
    ewalletRecords,
    createEwalletRecord
  );

  const ewalletRecordsIds = ewalletRecordsCreated.map(
    ewalletRecord => ewalletRecord.id
  );

  const { amount } = await Ewallet.findOne({ id: ewalletId });

  await Ewallet.update(
    { id: ewalletId },
    { EwalletRecord: ewalletRecordsIds, amount: generated + amount }
  );
};

const createEwalletRecord = async record => await EwalletRecord.create(record);

const validatePromoPercentageAmount = (ewalletAmount, total, ewalletConfig) => {
  const amount = new BigNumber(total)
    .multipliedBy(ewalletConfig.maximumPercentageToGeneratePoints)
    .dividedBy(100)
    .toNumber();
  if (ewalletAmount > amount) {
    return true;
  } else {
    return false;
  }
};

function getCountByUser(form) {
  var userId = form.userId;
  var fortNightRange = Common.getFortnightRange();

  //Fortnight range by default
  var startDate = form.startDate || fortNightRange.start;
  var endDate = form.endDate || fortNightRange.end;
  var queryDateRange = {
    User: userId,
    createdAt: { '>=': startDate, '<=': endDate },
  };
  var queryfortNightRange = {
    User: userId,
    createdAt: { '>=': fortNightRange.start, '<=': fortNightRange.end },
  };

  return Promise.join(
    Order.count(queryfortNightRange),
    Order.count(queryDateRange)
  ).then(function(results) {
    var response = {
      fortnight: results[0],
      dateRange: results[1],
    };
    return response;
  });
}

function getTotalsByUser(form) {
  var userId = form.userId;
  var getFortnightTotals = !_.isUndefined(form.fortnight)
    ? form.fortnight
    : true;
  var fortNightRange = Common.getFortnightRange();

  //Fortnight range by default
  var startDate = form.startDate || fortNightRange.start;
  var endDate = form.endDate || fortNightRange.end;
  var queryDateRange = {
    User: userId,
    createdAt: { '>=': startDate, '<=': endDate },
  };
  var queryfortNightRange = {
    User: userId,
    createdAt: { '>=': fortNightRange.start, '<=': fortNightRange.end },
  };

  var props = {
    totalDateRange: Order.find(queryDateRange).sum('total'),
  };
  if (getFortnightTotals) {
    props.totalFortnight = Order.find(queryfortNightRange).sum('total');
  }

  //Find all totals
  return Promise.props(props).then(function(result) {
    var totalFortnight = 0;
    var totalDateRange = 0;
    if (getFortnightTotals && result.totalFortnight.length > 0) {
      totalFortnight = result.totalFortnight[0].total;
    }
    if (result.totalDateRange.length > 0) {
      totalDateRange = result.totalDateRange[0].total;
    }
    var response = {
      fortnight: totalFortnight || false,
      dateRange: totalDateRange,
    };
    return response;
  });
}

function buildOrderCreateParams({
  user,
  quotation,
  currentStore,
  client,
  payments,
  address,
  clientBalanceRecords,
  ewalletRecords,
  broker,
}) {
  const paymentsIds = payments.map(function(p) {
    return p.id;
  });
  const SlpCode = user.Seller ? user.Seller.SlpCode : -1;

  var createParams = {
    source: quotation.source,
    ammountPaid: quotation.ammountPaid,
    total: quotation.total,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    paymentGroup: quotation.paymentGroup,
    groupCode: currentStore.GroupCode,
    totalProducts: quotation.totalProducts,
    Client: client.id,
    CardName: client.CardName,
    Quotation: quotation.id,
    Payments: paymentsIds,
    EwalletRecords: ewalletRecords,
    ClientBalanceRecords: clientBalanceRecords,
    User: user.id,
    CardCode: quotation.Client.CardCode,
    SlpCode: SlpCode,
    Store: currentStore.id,
    Manager: quotation.Manager,
  };

  if (broker) {
    createParams.Broker = broker.id;
  }

  createParams.status = 'paid';

  if (address) {
    createParams.Address = _.clone(address.id);
    createParams.address = _.clone(address.Address); //Address is the street field
    createParams.CntctCode = _.clone(address.CntctCode);

    delete address.id;
    delete address.Address; //Address field in person contact
    delete address.createdAt;
    delete address.updatedAt;
    delete address.CntctCode;
    delete address.CardCode;
    createParams = _.extend(createParams, address);
  }

  return createParams;
}

function validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate) {
  sapResult = sapResult || {};
  if (sapResponse && _.isArray(sapResult)) {
    if (sapResult.length <= 0) {
      throw new Error('No fue posible crear el pedido en SAP');
    }

    const sapResultWithBalance = _.clone(sapResult);
    sapResult = sapResult.filter(function(item) {
      return item.type !== BALANCE_SAP_TYPE;
    });

    //If only balance was returned
    if (sapResult.length === 0) {
      throw new Error('Documentos no generados en SAP');
    }

    const everyOrderHasPayments = sapResult.every(function(sapOrder) {
      return checkIfSapOrderHasPayments(sapOrder, paymentsToCreate);
    });
    const everyOrderHasFolio = sapResult.every(checkIfSapOrderHasReference);

    sails.log.info('everyOrderHasFolio', everyOrderHasFolio);
    sails.log.info('everyOrderHasPayments', everyOrderHasPayments);

    if (!everyOrderHasFolio) {
      throw new Error(collectSapErrors(sapResult) || true);
    } else if (everyOrderHasPayments && everyOrderHasFolio) {
      return true;
    }

    var clientBalance = extractBalanceFromSapResult(sapResultWithBalance);
    //Important to compare directly to false
    //When using an expression like !clientBalance
    //with clientBalance having a value of 0
    //(!clientBalance) gives true
    if (clientBalance === false) {
      throw new Error('Balance del cliente no definido en la respuesta');
    }
  }

  throw new Error('Error en la respuesta de SAP');
}

function collectSapErrors(sapResult) {
  var sapErrorsString = '';
  if (_.isArray(sapResult)) {
    var sapErrors = sapResult.map(collectSapErrorsBySapOrder);
    sapErrorsString = sapErrors.join(', ');
  }
  return sapErrorsString;
}

function collectSapErrorsBySapOrder(sapOrder) {
  if (sapOrder.type === ERROR_SAP_TYPE) {
    return sapOrder.result;
  }
  return null;
}

function checkIfSapOrderHasReference(sapOrder) {
  return (
    sapOrder.result &&
    (sapOrder.type === INVOICE_SAP_TYPE || sapOrder.type === ORDER_SAP_TYPE)
  );
}

function checkIfSapOrderHasPayments(sapOrder, paymentsToCreate) {
  if (_.isArray(sapOrder.Payments)) {
    //No payments are returned when using only client balance or credit
    if (
      everyPaymentIsClientBalanceOrCredit(paymentsToCreate) ||
      everyPaymentIsEwallet(paymentsToCreate)
    ) {
      return true;
    }

    if (sapOrder.Payments.length > 0) {
      return sapOrder.Payments.every(function(payment) {
        return !isNaN(payment.pay) && payment.reference;
      });
    }
  }

  return false;
}

function everyPaymentIsClientBalanceOrCredit(paymentsToCreate) {
  var everyPaymentIsClientBalance = paymentsToCreate.every(function(p) {
    return (
      p.type === PaymentService.CLIENT_BALANCE_TYPE ||
      p.type === PaymentService.types.CLIENT_CREDIT
    );
  });
  return everyPaymentIsClientBalance;
}

const everyPaymentIsEwallet = paymentsToCreate =>
  paymentsToCreate.every(
    payment => payment.type === PaymentService.EWALLET_TYPE
  );

function saveSapReferences(sapResult, order, orderDetails) {
  var clientBalance = extractBalanceFromSapResult(sapResult);
  var clientId = order.Client.id || order.Client;

  sapResult = sapResult.filter(function(item) {
    return item.type !== BALANCE_SAP_TYPE;
  });

  var ordersSap = sapResult.map(function(orderSap) {
    var orderSapReference = {
      Order: order.id,
      invoiceSap: orderSap.Invoice || null,
      document: orderSap.Order,
      PaymentsSap: orderSap.Payments.map(function(payment) {
        return {
          document: payment.pay,
          Payment: payment.reference,
        };
      }),
    };

    if (orderSap.type === INVOICE_SAP_TYPE) {
      orderSapReference.invoiceSap = orderSap.result;
    } else if (orderSap.type === ORDER_SAP_TYPE) {
      orderSapReference.document = orderSap.result;
    }

    if (orderSap.series && _.isArray(orderSap.series)) {
      orderSapReference.ProductSeries = orderSap.series.map(function(serie) {
        var productSerie = {
          QuotationDetail: serie.DetailId,
          OrderDetail: _.findWhere(orderDetails, {
            QuotationDetail: serie.DetailId,
          }),
          seriesNumbers: serie.Number,
        };
        return productSerie;
      });
    }

    return orderSapReference;
  });

  return Promise.join(
    OrderSap.create(ordersSap),
    Client.update({ id: clientId }, { Balance: clientBalance })
  );
}

function extractBalanceFromSapResult(sapResult) {
  var balanceItem = _.findWhere(sapResult, { type: BALANCE_SAP_TYPE });
  if (balanceItem && balanceItem.result && !isNaN(balanceItem.result)) {
    return parseFloat(balanceItem.result);
  }
  return false;
}

//@params
/*
  params: {
    Details (array of objects),
    storeId
    orderId
    quotationId,
    userId (object),
    Client (object)
  }
*/

function getPaidPercentage(amountPaid, total) {
  var percentage = amountPaid / (total / 100);

  //Floating point issue precision with JS
  //TODO find fix to precision
  //Problem: sometimes ammount paid and total is equal, but percentage throws: 99.99999999999999
  //Return 100 when total and ammount paid is equal
  if (amountPaid === total) {
    percentage = 100;
  }

  return percentage;
}

async function cancel(orderId, details, cancelAll) {
  const quotationFindCriteria = { Order: orderId };
  const quotation = await Quotation.findOne(quotationFindCriteria);
  const resultCancel = await SapService.cancelOrder(quotation.id);
  console.log('resultCacncel', resultCancel);

  const findCriteria = { id: orderId };
  const updateParams = { status: statusTypes.CANCELED };
  const updatedOrders = await Order.update(findCriteria, updateParams);
  const canceledOrder = updatedOrders[0];

  const paymentsFindCriteria = { Order: orderId };
  const paymentsUpdateParams = { status: PaymentService.statusTypes.CANCELED };
  await Payment.update(paymentsFindCriteria, paymentsUpdateParams);

  const quotationUpdateParams = {
    status: QuotationService.statusTypes.CANCELED,
  };
  await Quotation.update(quotationFindCriteria, quotationUpdateParams);

  // NEW THNIGS
  if (cancelAll) {
    await Order.update({ id: orderId }, { status: statusTypes.CANCELED });
  }
  if (!cancelAll) {
    details.map(async detail => {
      const orderDetail = await OrderDetail.findOne({ id: detail.id });
      await OrderDetail.update(
        { id: orderDetail.id },
        {
          quantityCanceled: detail.quantity,
          quantity: orderDetail.quantity - detail.quantity,
        }
      );
    });
  }

  return canceledOrder;
}

function isCanceled(order) {
  return order.status === statusTypes.CANCELED;
}

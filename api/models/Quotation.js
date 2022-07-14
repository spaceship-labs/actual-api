var moment = require('moment');

//APP COLLECTION
module.exports = {
  migrate: 'alter',
  schema: true,
  tableName: 'Quotation',
  attributes: {
    Client: {
      model: 'Client',
    },
    User: {
      model: 'User',
    },
    Broker: {
      model: 'BrokerSAP',
    },
    Details: {
      collection: 'QuotationDetail',
      via: 'Quotation',
    },
    Records: {
      collection: 'QuotationRecord',
      via: 'Quotation',
    },
    Address: {
      model: 'ClientContact',
    },
    Order: {
      model: 'Order',
    },
    Payments: {
      collection: 'Payment',
      via: 'Quotation',
    },
    EwalletRecords: {
      collection: 'EwalletRecord',
      via: 'Quotation',
    },
    ClientBalanceRecords: {
      collection: 'ClientBalanceRecord',
      via: 'Quotation',
    },
    Store: {
      model: 'store',
    },
    Manager: {
      model: 'user',
    },
    SapOrderConnectionLogs: {
      collection: 'SapOrderConnectionLog',
      via: 'Quotation',
    },

    brokerCode: { type: 'string' },
    CardName: { type: 'string' },
    CardCode: { type: 'string' },
    isClosed: { type: 'boolean' },
    isClosedReason: { type: 'string' },
    isClosedNotes: { type: 'text' },
    immediateDelivery: { type: 'boolean' },
    ShopDelivery:  { type: 'boolean' },
    weekenddate:  { type: 'boolean' },
    clientName: { type: 'string' },
    folio: { type: 'string' },
    total: { type: 'float' },
    totalPg1: { type: 'float' },
    subtotal: { type: 'float' },
    subtotal2: { type: 'float' }, // includes discounts but not big ticket neither family and friends
    discount: { type: 'float' },
    ammountPaid: { type: 'float' },
    ammountPaidPg1: { type: 'float' },
    totalProducts: { type: 'integer' },
    financingCostPercentage: 'float',
    paymentGroup: { type: 'integer' },
    appliesClientDiscount: { type: 'boolean' },
    estimatedCloseDate: { type: 'datetime' },

    bigticketMaxPercentage: {
      type: 'integer',
      enum: [0, 1, 2, 3, 4, 5],
    },
    bigticketPercentage: {
      type: 'integer',
      enum: [0, 1, 2, 3, 4, 5],
    },
    minPaidPercentage: {
      type: 'float',
      defaultsTo: 100,
    },
    //TODO: Check status types
    status: {
      type: 'string',
      //enum:['closed','pending-payment','to-order', 'canceled']
    },
    source: {
      type: 'string',
    },
    sourceType: {
      type: 'string',
    },
    tracing: {
      type: 'datetime',
    },
  },

  beforeCreate: function(val, cb) {
    if (process.env.NODE_ENV === 'test') {
      cb();
      return;
    }
    val.tracing = addDefaultTracingDate();
    Common.orderCustomAI(val, 'quotationFolio', function(val) {
      cb();
    });
  },
};

function addDefaultTracingDate() {
  return moment()
    .add(72, 'hours')
    .toDate();
}

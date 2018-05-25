const moment = require('moment');
const axiosD = require('axios');
const axios = axiosD.create({
  baseURL:
    process.env.MODE === 'production'
      ? process.env.FACTURA_URL_PRODUCTION
      : process.env.FACTURA_URL_SANDOX,
  headers: {
    'Content-Type': 'application/json',
    'F-API-KEY':
      process.env.MODE === 'production'
        ? process.env.FACTURA_KEY_PRODUCTION
        : process.env.FACTURA_KEY_SANDBOX,
    'F-SECRET-KEY':
      process.env.MODE === 'production'
        ? process.env.FACTURA_SECRET_KEY_PRODUCTION
        : process.env.FACTURA_SECRET_KEY_SANDBOX,
  },
});

module.exports = {
  async createInvoice(order, client, fiscalAddress, payments, details) {
    return await axios.post(
      '/v3/cfdi33/create',
      await formatInvoice(order, client, fiscalAddress, payments, details)
    );
  },
};

const formatInvoice = async (
  order,
  client,
  fiscalAddress,
  payments,
  details
) => ({
  Receptor: {
    UID: handleClient(await createClient(client, order.Client, fiscalAddress)),
  },
  TipoDocumento: 'factura',
  Conceptos: await getItems(details),
  UsoCFDI: client.cfdiUse,
  Serie: 1486,
  FormaPago: getPaymentWay(payments, order),
  MetodoPago: getPaymentMethod(
    getPaymentWay(payments, order),
    payments,
    order,
    '99'
  ),
  Moneda: 'MXN',
  FechaFromAPI: moment(order.createdAt).format('YYYY-MM-DDTHH:mm:ss'),
});

const handleClient = ({ data: client, error: error }) =>
  !client.Data || !client.Data.UID || error
    ? Promise.reject(new Error({ error }))
    : client.Data.UID;

const createClient = async (client, data, fiscal) =>
  !client ||
  !data.E_Mail ||
  !data.LicTradNum ||
  !fiscal.companyName ||
  !fiscal.Street ||
  !fiscal.U_NumExt ||
  !fiscal.ZipCode ||
  !fiscal.Block ||
  !fiscal.State ||
  !fiscal.City
    ? Promise.reject(new Error('Datos incompletos'))
    : await axios.post('/v1/clients/create', formatClent(client, data, fiscal));

const formatClent = (client, data, fiscal) => ({
  nombre: data.FirstName,
  apellidos: data.LastName,
  email: data.E_Mail,
  telefono: data.Phone1,
  razons: fiscal.companyName,
  rfc: data.LicTradNum,
  calle: fiscal.Street,
  numero_exterior: fiscal.U_NumExt,
  codpos: fiscal.ZipCode,
  colonia: fiscal.Block,
  estado: fiscal.State,
  ciudad: fiscal.City,
});

const getItems = async details =>
  formatItems(await getDetailsProducts(details.map(detail => detail.id)));

const getDetailsProducts = async ids =>
  await OrderDetail.find(ids).populate('Product');

const formatItems = details =>
  details.map(detail =>
    structuredItems(
      defineDiscount(detail.discountPercent),
      detail,
      detail.Product
    )
  );

const defineDiscount = discountPercent =>
  discountPercent
    ? parsingDiscount(Math.abs(discountPercent))
    : parsingDiscount(Math.abs(0));

const parsingDiscount = discount =>
  discount < 1 ? parseFloat(discount.toFixed(4)) : discount;

const structuredItems = (discount, detail, product) => ({
  ClaveProdServ: product.U_ClaveProdServ,
  Cantidad: detail.quantity,
  ClaveUnidad: product.U_ClaveUnidad,
  Unidad: getUnitTypeByProduct(product.Service, product.U_ClaveUnidad),
  ValorUnitario: detail.unitPrice / 1.16,
  Descripcion: product.ItemName,
  Descuento: parseFloat(discount.toFixed(4)),
});

const getUnitTypeByProduct = (service, U_ClaveUnidad) =>
  service === 'Y' ? 'Unidad de servicio' : getUnitType(U_ClaveUnidad);

const executeIfFunction = f => (f instanceof Function ? f() : f);

const switchcase = cases => defaultCase => key =>
  cases.hasOwnProperty(key) ? cases[key] : defaultCase;

const switchcaseF = cases => defaultCase => key =>
  executeIfFunction(switchcase(cases)(defaultCase)(key));

const getUnitType = U_ClaveUnidad =>
  switchcaseF({
    H87: () => 'Pieza',
    SET: () => 'Conjunto',
    E48: () => 'Unidad de servicio',
  })('Pieza')(U_ClaveUnidad);

const getWay = (paymentMethod, type) =>
  switchcaseF({
    cash: () => (paymentMethod = '01'),
    'cash-usd': () => (paymentMethod = '01'),
    deposit: () => (paymentMethod = '01'),
    cheque: () => (paymentMethod = '02'),
    'transfer-usd': () => (paymentMethod = '03'),
    transfer: () => (paymentMethod = '03'),
    'single-payment-terminal': () => (paymentMethod = '04'),
    'credit-card': () => (paymentMethod = '04'),
    '3-msi': () => (paymentMethod = '04'),
    '3-msi-banamex': () => (paymentMethod = '04'),
    '6-msi': () => (paymentMethod = '04'),
    '6-msi-banamex': () => (paymentMethod = '04'),
    '9-msi': () => (paymentMethod = '04'),
    '9-msi-banamex': () => (paymentMethod = '04'),
    '12-msi': () => (paymentMethod = '04'),
    '12-msi-banamex': () => (paymentMethod = '04'),
    '13-msi': () => (paymentMethod = '04'),
    '18-msi': () => (paymentMethod = '04'),
    ewallet: () => (paymentMethod = '05'),
    'debit-card': () => (paymentMethod = '28'),
    'client-balance': () => (paymentMethod = '99'),
    'client-credit': () => (paymentMethod = '99'),
  })(paymentMethod)(type);

//Excludes CLIENT BALANCE and CREDIT CLIENT payments
const getDirectPayments = payments =>
  payments.filter(
    p =>
      p.type !== PaymentService.CLIENT_BALANCE_TYPE &&
      p.type !== PaymentService.types.CLIENT_CREDIT
  );

const ammountCompare = (currency, payment, ammount, exchangeRate) =>
  currency === PaymentService.CURRENCY_USD
    ? PaymentService.calculateUSDPayment(payment, exchangeRate)
    : ammount;

const getHighestPayment = payments => {
  payments.reduce(
    (prev, current) =>
      ammountCompare(prev.currency, prev, prev.ammount, prev.exchangeRate) >
      ammountCompare(
        current.currency,
        current,
        current.ammount,
        current.exchangeRate
      )
        ? prev
        : current
  );
};

/*
Rule 20th April 2018
When applying cash plus other payment method(except client balance or client credit)
If cash is the main payment method
and the total is 100k or above
*/
const appliesForSpecialCashRule = (
  payments,
  order,
  INVOICE_AMOUNT_LIMIT_CONSTRAINT
) =>
  payments.length > 1 && order.total >= INVOICE_AMOUNT_LIMIT_CONSTRAINT
    ? validatePaymentType(getHighestPayment(payments))
    : false;

const validatePaymentType = highestPayment =>
  highestPayment.type === PaymentService.types.CASH ||
  highestPayment.type === PaymentService.types.CASH_USD
    ? true
    : false;

const getPaymentWay = (payments, order) => {
  var paymentMethod = '99';
  var uniquePaymentMethod = payments[0];
  var directPayments = [];

  if (payments.length > 1) {
    //Taking the highest payment as main, except the
    //client-credit and client balance payment type
    directPayments = getDirectPayments(payments);

    if (directPayments.length === 0) {
      return '99';
    }
    uniquePaymentMethod = getHighestPayment(directPayments);

    if (appliesForSpecialCashRule(payments, order, 100000)) {
      return '99';
    }
  }

  return getWay('99', uniquePaymentMethod.type);
};

const getPaymentMethod = (paymentWay, payments, order, toDefine) =>
  paymentWay === toDefine || appliesForSpecialCashRule(payments, order, 100000)
    ? 'PPD'
    : 'PUE';

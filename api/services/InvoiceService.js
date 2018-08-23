const moment = require('moment');
const axiosD = require('axios');
const axios = axiosD.create({
  baseURL: process.env.ENLACE_FISCAL_BASEURL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ENLACE_FISCAL_API_KEY,
  },
  auth: {
    username: process.env.EMISOR_RFC,
    password: process.env.ENLACE_FICAL_TOKEN,
  },
});
const INVOICE_MODE = process.env.MODE === 'production' ? 'produccion' : 'debug';
const ENLACE_FISCAL_VERSION = '6.0';
const TAXES_TYPE = 'traslado';
const TAXES_KEY = 'IVA';
const TAXES_FACTOR_TYPE = 'tasa';
const TAXES_VALUATION = '0.16';
const PAYMENT_METHOD_TO_DEFINE = '99';
const DEFAULT_CFDI_USE = 'P01';

module.exports = {
  async createInvoice(order, client, fiscalAddress, payments, details) {
    const genericClient =
      client.LicTradNum ||
      client.LicTradNum == FiscalAddressService.GENERIC_RFC;
    return await axios.post(
      '/generarCfdi',
      await formatInvoice(
        order,
        client,
        fiscalAddress,
        payments,
        await getItems(details),
        genericClient
      )
    );
  },

  async createElectronicPayment(
    order,
    client,
    fiscalAddress,
    payments,
    folioFiscalUUID
  ) {
    return await axios.post(
      '/generarReciboElectronicoPago',
      await formatElectronicPayment(
        order,
        client,
        fiscalAddress,
        payments,
        folioFiscalUUID
      )
    );
  },

  async removeInvoice(id) {
    const { folio } = await Invoice.findOne({ Order: id });
    return await axios.post('/cancelarCfdi', formatCancelInvoiceRequest(folio));
  },

  async send(orderId) {
    const { Client } = Order.findOne({ id: orderId }).populate('Client');
    const { folio } = Invoice.findOne({ order: orderId });
    const email = Client.E_Mail;
    return await axios.post(
      '/enviarCorreo',
      formatSendMailRequest(folio, email)
    );
  },
};

const formatSendMailRequest = (folio, email) => ({
  Solicitud: {
    rfc: process.env.EMISOR_RFC,
    accion: 'enviarCorreo',
    CFDi: {
      serie: 'FA',
      folio,
      EnviarCFDI: {
        Correos: [email],
      },
    },
  },
});

const formatElectronicPayment = (
  order,
  client,
  fiscalAddress,
  payments,
  folioFiscalUUID
) => ({
  CFDi: {
    modo: INVOICE_MODE,
    versionEF: ENLACE_FISCAL_VERSION,
    serie: 'RE',
    folioInterno: order.folio,
    fechaEmision: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    rfc: process.env.EMISOR_RFC,
    Receptor: handleClient(client, order.Client, fiscalAddress),
    ComplementoPago: handlePaymentComplement(order, payments, folioFiscalUUID),
  },
});

const handlePaymentComplement = (order, payments, folioFiscalUUID) => ({
  Pago: {
    fechaPago: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    formaDePago: getPaymentWay(payments, order),
    tipoMoneda: 'MXN',
    monto: order.total,
    DocumentosRelacionados: [
      {
        idDocumento: folioFiscalUUID,
        serie: 'FA',
        folioInterno: order.folio,
        tipoMoneda: 'MXN',
        metodoDePago: getPaymentMethod(
          getPaymentWay(payments, order),
          payments,
          order,
          PAYMENT_METHOD_TO_DEFINE
        ),
        importePagado: order.total,
      },
    ],
  },
});

const formatCancelInvoiceRequest = folio => ({
  Solicitud: {
    modo: INVOICE_MODE,
    rfc: process.env.EMISOR_RFC,
    accion: 'cancelarCfdi',
    CFDi: {
      serie: 'FA',
      folio: folio,
      // justificacion: 'Error en descripción de producto',
    },
  },
});

const formatInvoice = async (
  order,
  client,
  fiscalAddress,
  payments,
  Partidas,
  genericClient
) => ({
  CFDi: {
    modo: INVOICE_MODE,
    versionEF: ENLACE_FISCAL_VERSION,
    serie: 'FA',
    folioInterno: parseInt(order.folio),
    fechaEmision: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
    subTotal: getSubTotalFixed(Partidas),
    descuentos: getDiscountFixed(Partidas),
    total: getTotalFixed(
      getSubTotalFixed(Partidas),
      getDiscountFixed(Partidas),
      getTaxesAmount(Partidas)
    ),
    tipoMoneda: 'MXN',
    rfc: process.env.EMISOR_RFC,
    DatosDePago: {
      metodoDePago: getPaymentMethod(
        getPaymentWay(payments, order),
        payments,
        order,
        PAYMENT_METHOD_TO_DEFINE
      ),
      formaDePago: getPaymentWay(payments, order),
    },
    Receptor: await handleClient(
      client,
      order.Client,
      fiscalAddress,
      genericClient
    ),
    Partidas,
    Impuestos: {
      Totales: {
        traslados: getTaxesAmount(Partidas),
      },
      Impuestos: [
        {
          tipo: TAXES_TYPE,
          claveImpuesto: TAXES_KEY,
          tipoFactor: TAXES_FACTOR_TYPE,
          tasaOCuota: TAXES_VALUATION,
          importe: getTaxesAmount(Partidas),
        },
      ],
    },
    EnviarCFDI: {
      Correos:
        process.env.MODE === 'production'
          ? [
              fiscalAddress.U_Correos,
              'facturamiactual@actualstudio.com',
              'facturacion@actualg.com',
            ]
          : ['yupit@spaceshiplabs.com', 'luisperez@spaceshiplabs.com'],
      mensajeCorreo: '',
    },
  },
});

const getTotalFixed = (subtotal, discount, taxes) => {
  const total = subtotal * 100 - discount * 100 + taxes * 100;
  return total / 100;
};

const getSubTotalFixed = items => {
  const amounts = items.map(item => item.importe * 100);
  const totalAmounts = amounts.reduce((total, amount) => total + amount, 0);
  return totalAmounts / 100;
};

const getDiscountFixed = items => {
  const discounts = items.map(item => item.descuento * 100);
  const totalDiscount = discounts.reduce((total, amount) => total + amount, 0);
  return totalDiscount / 100;
};

const getTwoDecimalsTaxesAmount = amount => parseFloat(amount.toFixed(2));

const getTaxesAmount = items =>
  getTwoDecimalsTaxesAmount(
    getTotalTaxesAmount(items.map(item => item.Impuestos[0].importe * 100))
  );

const getTotalTaxesAmount = taxesAmount =>
  taxesAmount.reduce((total, amount) => total + amount, 0) / 100;

const handleClient = async (client, data, fiscal, genericClient) =>
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
    : formatClent(client, data, fiscal, genericClient);

const formatClent = (client, orderClient, fiscalAddress, genericClient) =>
  genericClient
    ? {
        rfc: orderClient.LicTradNum,
        nombre: orderClient.CardName,
        usoCfdi: client.cfdiUse,
        DomicilioFiscal: {
          calle: fiscalAddress.Street,
          noExterior: fiscalAddress.U_NumExt,
          colonia: fiscalAddress.Block,
          localidad: fiscalAddress.City,
          estado: fiscalAddress.State,
          pais: 'México',
          cp: fiscalAddress.ZipCode,
        },
      }
    : {
        rfc: FiscalAddressService.GENERIC_RFC,
        nombre: orderClient.CardName,
        usoCfdi: DEFAULT_CFDI_USE,
        DomicilioFiscal: {
          calle: fiscalAddress.Street || 'Av Xcaret',
          noExterior: fiscalAddress.U_NumExt || 'Lote 3',
          estado: orderClient.U_Estado || 'Quintana Roo',
          pais: 'México',
        },
      };

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
  cantidad: detail.quantity,
  claveUnidad: product.U_ClaveUnidad,
  Unidad: getUnitTypeByProduct(product.Service, product.U_ClaveUnidad),
  claveProdServ: product.U_ClaveProdServ,
  noIdentificacion: product.ItemCode,
  descripcion: product.ItemName,
  valorUnitario: detail.unitPrice / 1.16,
  importe: getImportFixed(detail.quantity, detail.unitPrice),
  descuento: parseFloat(discount.toFixed(2)),
  Impuestos: [
    {
      tipo: TAXES_TYPE,
      claveImpuesto: TAXES_KEY,
      tipoFactor: TAXES_FACTOR_TYPE,
      tasaOCuota: TAXES_VALUATION,
      baseImpuesto:
        detail.quantity * (detail.unitPrice / 1.16) -
        parseFloat(discount.toFixed(4)),
      importe: parseFloat(
        getItemsAmountFixed(
          detail.quantity,
          detail.unitPrice,
          discount
        ).toFixed(2)
      ),
    },
  ],
});

const getImportFixed = (quantity, unitPrice) => {
  const amount = quantity * (unitPrice / 1.16);
  const amountFixed = parseFloat(amount.toFixed(2));
  return amountFixed;
};

const getItemsAmountFixed = (quantity, unitPrice, discount) =>
  (quantity * (unitPrice / 1.16) - parseFloat(discount.toFixed(4))) * 0.16;

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
    'client-balance': () => (paymentMethod = PAYMENT_METHOD_TO_DEFINE),
    'client-credit': () => (paymentMethod = PAYMENT_METHOD_TO_DEFINE),
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
  var paymentMethod = PAYMENT_METHOD_TO_DEFINE;
  var uniquePaymentMethod = payments[0];
  var directPayments = [];

  if (payments.length > 1) {
    //Taking the highest payment as main, except the
    //client-credit and client balance payment type
    directPayments = getDirectPayments(payments);

    if (directPayments.length === 0) {
      return PAYMENT_METHOD_TO_DEFINE;
    }
    uniquePaymentMethod = getHighestPayment(directPayments);

    if (appliesForSpecialCashRule(payments, order, 100000)) {
      return PAYMENT_METHOD_TO_DEFINE;
    }
  }

  return getWay(PAYMENT_METHOD_TO_DEFINE, uniquePaymentMethod.type);
};

const getPaymentMethod = (paymentWay, payments, order, toDefine) =>
  paymentWay === toDefine || appliesForSpecialCashRule(payments, order, 100000)
    ? 'PPD'
    : 'PUE';

var baseURL               = process.env.baseURL;
var key                   = process.env.SENDGRIDAPIKEY;
var Promise               = require('bluebird');
var moment                = require('moment');
var fs                    = require('fs');
var ejs                   = require('ejs');
var moment                = require('moment');
var sendgrid              = require('sendgrid').SendGrid(key);
var helper                = require('sendgrid').mail;
var passwordTemplate      = fs.readFileSync(sails.config.appPath + '/views/email/password.html').toString();
var orderTemplate         = fs.readFileSync(sails.config.appPath + '/views/email/order.html').toString();
var quotationTemplate     = fs.readFileSync(sails.config.appPath + '/views/email/quotation.html').toString();
passwordTemplate          = ejs.compile(passwordTemplate);
orderTemplate             = ejs.compile(orderTemplate);
quotationTemplate         = ejs.compile(quotationTemplate);

module.exports = {
  sendPasswordRecovery: password,
  sendOrderConfirmation: orderEmail,
  sendQuotation: quotation
};

function password(userName, userEmail, recoveryUrl, cb) {
  var user_name       = userName;
  var user_link       = recoveryUrl;
  var company_name    = 'actual group';
  var company_img     = 'http://actual.spaceshiplabs.com/assets/images/logo.png';
  var company_address = '';
  var company_city    = '';
  var company_state   = '';
  var company_ip      = '';
  var unsubscribe     = '#';
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "actualgroup");
  var to              = new helper.Email(userEmail, userName);
  var subject         = 'recuperar contraseña';
  var res             = passwordTemplate({
    user_name: user_name,
    user_link: user_link,
    company_name: company_name,
    company_img: company_img,
    company_address: company_address,
    company_city: company_city,
    company_state: company_state,
    company_ip: company_ip,

    unsubscribe: unsubscribe
  });
  var content         = new helper.Content("text/html", res);

  personalization.addTo(to);
  personalization.setSubject(subject);

  mail.setFrom(from);
  mail.addContent(content)
  mail.addPersonalization(personalization)

  requestBody = mail.toJSON()
  request.method = 'POST'
  request.path = '/v3/mail/send'
  request.body = requestBody
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function orderEmail(orderId) {
  return Order
    .findOne(orderId)
    .populate('Client')
    .populate('User')
    .populate('Store')
    .populate('Details')
    .populate('Payments')
    .then(function(order) {
      var client   = order.Client;
      var user     = order.User;
      var store    = order.Store;
      var details  = order.Details.map(function(detail) { return detail.id; });
      var payments = order.Payments.map(function(payment) { return payment.id; });
      details      = OrderDetail.find(details).populate('Product');
      payments     = Payment.find(payments);
      return [client, user,  order, details, payments, store];
    })
    .spread(function(client, user, order, details, payments, store) {
      var products = details.map(function(detail) {
        var date  = moment(detail.shipDate);
        moment.locale('es');
        date.locale(false);
        date = date.format('LL');
        return {
          name:  detail.Product.ItemName,
          code:  detail.Product.ItemCode,
          color: detail.Product.DetailedColor,
          material: 'add_material',
          warranty: detail.Product.U_garantia,
          qty: detail.quantity,
          ship: date,
          price: Number(detail.total).toFixed(2),
          image: baseURL + '/uploads/products/' + detail.Product.icon_filename
        };
      });
      var payments = payments.map(function(payment) {
        var ammount =  payment.currency == 'usd' ? payment.ammount * payment.exchangeRate: payment.ammount;
        ammount = ammount.toFixed(2);
        var date    = moment(payment.createdAt);
        moment.locale('es');
        date.locale(false);
        date = date.format('LL');
        return {
          method: paymentMethod(payment),
          date: date,
          folio: payment.folio,
          type: paymentType(payment),
          ammount: ammount,
          currency: payment.currency
        };
      });
      return sendOrder(client, user, order, products, payments, store);
    });
}

function sendOrder(client, user, order, products, payments, store) {
  var emailBody = orderTemplate({
    client: {
      name: client.CardName,
      address: order.address,
      phone: client.Phone1,
      cel: client.Cellular
    },
    user: {
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      phone: user.phone
    },
    order: {
      folio: order.folio,
      subtotal: Number(order.subtotal).toFixed(2),
      discount: Number(order.discount).toFixed(2),
      total: Number(order.total).toFixed(2),
      paid: Number(order.total).toFixed(2),
      pending: Number(0).toFixed(2)
    },
    company: {
      image: store.logo
    },
    products: products,
    payments: payments,
    ewallet: {
      prev: '',
      received: '',
      paid: '',
      balance: ''
    }
  });

  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email('tugorez@gmail.com', 'juanjo');
  var to               = new helper.Email('tugorez@gmail.com', 'juanjo'); //cambia
  var subject          = 'confirmación de compra';
  var content          = new helper.Content("text/html", emailBody);
  personalization.addTo(to);
  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST'
  request.path = '/v3/mail/send'
  request.body = requestBody
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        resolve(order);
      } else {
        reject(response);
      }
    });
  });
}

function quotation(quotationId) {
  return Quotation
    .findOne(quotationId)
    .populate('Client')
    .populate('User')
    .populate('Store')
    .populate('Details')
    .populate('Payments')
    .then(function(quotation) {
      var client   = quotation.Client;
      var user     = quotation.User;
      var store    = quotation.Store;
      var details  = quotation.Details.map(function(detail) { return detail.id; });
      var payments = quotation.Payments.map(function(payment) { return payment.id; });
      details      = QuotationDetail.find(details).populate('Product');
      payments     = Payment.find(payments);
      return [client, user,  quotation, details, payments, store];
    })
    .spread(function(client, user, quotation, details, payments, store) {
      var products = details.map(function(detail) {
        var date  = moment(detail.shipDate);
        moment.locale('es');
        date.locale(false);
        date = date.format('LL');
        return {
          name:  detail.Product.ItemName,
          code:  detail.Product.ItemCode,
          color: detail.Product.DetailedColor,
          material: 'add_material',
          warranty: detail.Product.U_garantia,
          qty: detail.quantity,
          ship: date,
          price: Number(detail.total).toFixed(2),
          image: baseURL + '/uploads/products/' + detail.Product.icon_filename
        };
      });
      var payments = payments.map(function(payment) {
        var ammount =  payment.currency == 'usd' ? payment.ammount * payment.exchangeRate: payment.ammount;
        ammount = ammount.toFixed(2);
        var date    = moment(payment.createdAt);
        moment.locale('es');
        date.locale(false);
        date = date.format('LL');
        return {
          method: paymentType(payment),
          date: date,
          folio: payment.folio,
          type: paymentType(payment),
          ammount: ammount,
          currency: payment.currency
        };
      });
      return sendQuotation(client, user, quotation, products, payments, store);
    });

}

function sendQuotation(client, user, quotation, products, payments, store) {
  var emailBody = orderTemplate({
    client: {
      name: client.CardName,
      address: '',
      phone: client.Phone1,
      cel: client.Cellular
    },
    user: {
      name: user.firstName + ' ' + user.lastName,
      email: user.email,
      phone: user.phone
    },
    order: {
      folio: quotation.folio,
      subtotal: Number(quotation.subtotal).toFixed(2),
      discount: Number(quotation.discount).toFixed(2),
      total: Number(quotation.total).toFixed(2),
      paid: Number(quotation.ammountPaid).toFixed(2),
      pending: Number(quotation.total - quotation.ammountPaid).toFixed(2)
    },
    company: {
      image: store.logo
    },
    products: products,
    payments: payments,
    ewallet: {
      prev: '',
      received: '',
      paid: '',
      balance: ''
    }
  });

  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email('tugorez@gmail.com', 'juanjo');
  var to               = new helper.Email('tugorez@gmail.com', 'juanjo'); //cambia
  var subject          = 'Cotización';
  var content          = new helper.Content("text/html", emailBody);
  personalization.addTo(to);
  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST'
  request.path = '/v3/mail/send'
  request.body = requestBody
  return new Promise(function(resolve, reject){
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <= 299) {
        resolve(order);
      } else {
        reject(response);
      }
    });
  });
}


function paymentMethod(payment) {
  var payment_name;
  switch (payment.type) {
    case 'cash':
      payment_name = 'Efectivo (MXN)';
      break;
    case 'cash-usd':
      payment_name = 'Efectivo (USD)';
      break;
    case 'deposit':
      payment_name = 'Depósito';
      break;
    case 'transfer':
      payment_name = 'Transferencia';
      break;
    case 'monedero':
      payment_name = 'Monedero';
      break;
    case 'credit-card':
    case 'single-payment-terminal':
    case '3-msi':
    case '6-msi':
    case '9-msi':
    case'12-msi':
    case'18-msi':
      payment_name = 'Terminal';
      break;
    case 'cheque':
      payment_name: 'Cheque';
      break;
    default:
      payment_name = '';
      break;
  }
  return payment_name;
}

function paymentType(payment) {
  var payment_name;
  switch (payment.type) {
    case 'cash':
    case 'cash-usd':
      payment_name = 'Contado';
      break;
    case 'deposit':
      payment_name = 'Depósito';
      break;
    case 'transfer':
      payment_name = 'Transferencia';
      break;
    case 'credit-card':
      payment_name = 'Crédito ' + payment.terminal;
      break;
    case 'single-payment-terminal':
      payment_name = 'Débito ' + payment.terminal;
      break;
    case 'monedero':
      payment_name = 'Monedero';
      break;
    case '3-msi':
    case '6-msi':
    case '9-msi':
    case'12-msi':
    case'18-msi':
      payment_name = payment.type + ' ' + payment.terminal;
      break;
    case 'cheque':
      payment_name: 'Cheque';
      break;
    default:
      payment_name = '';
      break;
  }
  return payment_name;
}
/*
var baseURL               = process.env.baseURL;
var moment                = require('moment');
var fs                    = require('fs');
var ejs                   = require('ejs');
var key                   = process.env.SENDGRIDAPIKEY;
var sendgrid              = require('sendgrid').SendGrid(key);
var helper                = require('sendgrid').mail;
var passwordTemplate      = fs.readFileSync(sails.config.appPath + '/views/email/password/template.html').toString();
var orderTemplate         = fs.readFileSync(sails.config.appPath + '/views/email/order/template.html').toString();
var orderItemTemplate     = fs.readFileSync(sails.config.appPath + '/views/email/order/item.html').toString();
var orderPNameTemplate    = fs.readFileSync(sails.config.appPath + '/views/email/order/payment_name.html').toString();
var orderPTotalTemplate   = fs.readFileSync(sails.config.appPath + '/views/email/order/payment_total.html').toString();
var quotationTemplate     = fs.readFileSync(sails.config.appPath + '/views/email/quote/template.html').toString();
var quotationItemTemplate = fs.readFileSync(sails.config.appPath + '/views/email/quote/item.html').toString();
passwordTemplate          = ejs.compile(passwordTemplate);
orderTemplate             = ejs.compile(orderTemplate);
orderItemTemplate         = ejs.compile(orderItemTemplate);
orderPNameTemplate        = ejs.compile(orderPNameTemplate);
orderPTotalTemplate       = ejs.compile(orderPTotalTemplate);
quotationTemplate         = ejs.compile(quotationTemplate);
quotationItemTemplate     = ejs.compile(quotationItemTemplate);

module.exports = {
  sendPasswordRecovery: password,
  sendOrderConfirmation: order,
  sendQuotation: quotation
};

function password(userName, userEmail, recoveryUrl, cb) {
  var user_name       = userName;
  var user_link       = recoveryUrl;
  var company_name    = 'actual group';
  var company_img     = 'http://actual.spaceshiplabs.com/assets/images/logo.png';
  var company_address = '';
  var company_city    = '';
  var company_state   = '';
  var company_ip      = '';
  var unsubscribe     = '#';
  var request         = sendgrid.emptyRequest();
  var requestBody     = undefined;
  var mail            = new helper.Mail();
  var personalization = new helper.Personalization();
  var from            = new helper.Email("noreply@actualgroup.com", "actualgroup");
  var to              = new helper.Email(userEmail, userName);
  var subject         = 'recuperar contraseña';
  var res             = passwordTemplate({
    user_name: user_name,
    user_link: user_link,

    company_name: company_name,
    company_img: company_img,
    company_address: company_address,
    company_city: company_city,
    company_state: company_state,
    company_ip: company_ip,

    unsubscribe: unsubscribe
  });
  var content         = new helper.Content("text/html", res);

  personalization.addTo(to);
  personalization.setSubject(subject);

  mail.setFrom(from);
  mail.addContent(content)
  mail.addPersonalization(personalization)

  requestBody = mail.toJSON()
  request.method = 'POST'
  request.path = '/v3/mail/send'
  request.body = requestBody
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function order(order, orderAddress, user, client, details, payments, cb) {
  var client_name      = client.CardName;
  var order_id         = order.id;
  var ewallet          = parseFloat(client.ewallet).toFixed(2);
  var shipping_date    = details.reduce(function(max, current) {
    return current.shipDate > max.shipDate ? current: max;
  }, new Date());
  shipping_date = moment(shipping_date).format('DD-MM-YYYY');
  var shipping_address = orderAddress.Address;
  var products         = details.reduce(function(html, detail) {
    return html + orderItemTemplate({
      product_name: detail.Product.ItemName,
      product_image: baseURL + '/uploads/products/' + detail.Product.icon_filename,
      product_quantity: detail.quantity,
      product_total: parseFloat(detail.total).toFixed(2)
    });
  }, '');
  var payments_names   = payments.reduce(function(html, payment) {
    var payment_name;
    switch (payment.type) {
      case 'cash':
        payment_name = 'efectivo';
        break;
      case 'cash-usd':
        payment_name = 'dolares';
        break;
      case 'deposit':
        payment_name = 'depósito';
        break;
      case 'transfer':
        payment_name = 'transferencia';
        break;
      case 'credit-card':
        payment_name = 'crédito ' + payment.terminal;
        break;
      case 'single-payment-terminal':
        payment_name = 'débito ' + payment.terminal;
        break;
      case 'monedero':
        payment_name = 'monedero';
        break;
      case '3-msi':
      case '6-msi':
      case '9-msi':
      case'12-msi':
      case'18-msi':
        payment_name = payment.type + ' ' + payment.terminal;
        break;
      case 'cheque':
        payment_name: 'cheque';
        break;
      default:
        payment_name = 'error';
        break;
    }
    return html + orderPNameTemplate({
      payment_name: payment_name
    });
  }, '');
  var payments_totals  = payments.reduce(function(html, payment) {
    var payment_total = parseFloat(payment.ammount).toFixed(2);
    return html + orderPTotalTemplate({
      payment_total: payment_total
    });
  }, '');
  var total            = parseFloat(order.total).toFixed(2);
  var subtotal         = parseFloat(order.subtotal).toFixed(2);
  var discount         = parseFloat(order.discount).toFixed(2);
  var user_name        = user.firstName;
  var user_email       = user.email;
  var user_phone       = user.phone;
  var company_name     = 'Actual Group';
  var company_address  = 'Av coba #10';
  var company_city     = 'Cancún';
  var company_state    = 'Quintana Roo';
  var company_img      = 'http://actual.spaceshiplabs.com/assets/images/logo.png';
  var unsubscribe      = '#';
  var emailBody        = orderTemplate({
    client_name: client_name,
    order_id: order_id,
    ewallet: ewallet,
    shipping_date: shipping_date,
    shipping_address: shipping_address,
    products: products,
    payments_names: payments_names,
    payments_totals: payments_totals,
    subtotal: subtotal,
    discount: discount,
    total: total,
    user_name: user_name,
    user_email: user_email,
    user_phone: user_phone,
    company_name: company_name,
    company_img: company_img,
    company_address: company_address,
    company_city: company_city,
    company_state: company_state,
    unsubscribe: unsubscribe
  });

  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email(user_email, user_name);
  var to               = new helper.Email(user_email, client_name); //cambia
  //var to               = new helper.Email('tugorez@gmail.com', client_name); //cambia
  var subject          = 'confirmación de compra';
  var content          = new helper.Content("text/html", emailBody);
  personalization.addTo(to);
  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST'
  request.path = '/v3/mail/send'
  request.body = requestBody
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}

function quotation(quote, user, client, details, cb) {
  var client_name      = client.CardName;
  var products         = details.reduce(function(html, detail) {
    return html + quotationItemTemplate({
      product_name: detail.Product.ItemName,
      product_image: baseURL + '/uploads/products/' + detail.Product.icon_filename,
      product_quantity: detail.quantity,
      product_total: parseFloat(detail.total).toFixed(2)
    });
  }, '');
  var total            = parseFloat(quote.total).toFixed(2);
  var subtotal         = parseFloat(quote.subtotal).toFixed(2);
  var discount         = parseFloat(quote.discount).toFixed(2);
  var user_name        = user.firstName;
  var user_email       = user.email;
  var user_phone       = user.phone;
  var company_name     = 'Actual Group';
  var company_address  = 'Av coba #10';
  var company_city     = 'Cancún';
  var company_state    = 'Quintana Roo';
  var company_img      = 'http://actual.spaceshiplabs.com/assets/images/logo.png';
  var unsubscribe      = '#';
  var emailBody        = quotationTemplate({
    client_name: client_name,
    products: products,
    subtotal: subtotal,
    discount: discount,
    total: total,
    user_name: user_name,
    user_email: user_email,
    user_phone: user_phone,
    company_name: company_name,
    company_img: company_img,
    company_address: company_address,
    company_city: company_city,
    company_state: company_state,
    unsubscribe: unsubscribe
  });
  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email(user_email, user_name);
  var to               = new helper.Email(user_email, client_name); //cambia
  //var to               = new helper.Email('tugorez@gmail.com', client_name); //cambia
  var subject          = 'cotización';
  var content          = new helper.Content("text/html", emailBody);
  personalization.addTo(to);
  personalization.setSubject(subject);
  mail.setFrom(from);
  mail.addContent(content);
  mail.addPersonalization(personalization);
  requestBody = mail.toJSON();
  request.method = 'POST'
  request.path = '/v3/mail/send'
  request.body = requestBody
  sendgrid.API(request, function (response) {
    if (response.statusCode >= 200 && response.statusCode <= 299) {
      cb();
    } else {
      cb(response);
    }
  });
}
*/

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

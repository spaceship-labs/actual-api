var baseURL               = process.env.baseURL;
var key                   = process.env.SENDGRIDAPIKEY;
var Promise               = require('bluebird');
var moment                = require('moment');
var numeral               = require('numeral');
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
    .populate('EwalletRecords')
    .then(function(order) {
      var client   = order.Client;
      var user     = order.User;
      var store    = order.Store;
      var details  = order.Details.map(function(detail) { return detail.id; });
      var payments = order.Payments.map(function(payment) { return payment.id; });
      var ewallet  = order.EwalletRecords;
      details      = OrderDetail.find(details).populate('Product');
      payments     = Payment.find(payments);
      return [client, user,  order, details, payments, ewallet, store];
    })
    .spread(function(client, user, order, details, payments, ewallet, store) {
      var products = details.map(function(detail) {
        var date  = moment(detail.shipDate);
        moment.locale('es');
        date.locale(false);
        date = date.format('d/MMM/YYYY');
        return {
          id: detail.Product.id,
          name:  detail.Product.ItemName,
          code:  detail.Product.ItemCode,
          color: detail.Product.DetailedColor,
          material: '',
          ewallet: detail.ewallet && detail.ewallet.toFixed(2),
          warranty: detail.Product.U_garantia.toLowerCase(),
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
        date = date.format('d/MMM/YYYY');
        return {
          method: paymentMethod(payment),
          date: date,
          folio: payment.folio,
          type: paymentType(payment),
          ammount: ammount,
          currency: payment.currency
        };
      });
      var bewallet = client.ewallet;
      var pewallet = ewallet.reduce(function(acum, curr) {
        if (curr.type == 'negative') {
          return acum + curr.amount;
        }
        return acum - curr.amount;
      }, bewallet);
      var eewallet = ewallet.reduce(function(acum, curr) {
        if (curr.type == 'positive') {
          return acum + curr.amount;
        }
        return acum;
      }, 0);
      var sewallet = ewallet.reduce(function(acum, curr) {
        if (curr.type == 'negative') {
          return acum + curr.amount;
        }
        return acum;

      }, 0);
      ewallet = {
        prev: pewallet.toFixed(2),
        earned: eewallet.toFixed(2),
        spent: sewallet.toFixed(2),
        balance: bewallet.toFixed(2)
      };
      return [client, user, order, products, payments, ewallet, store];
    })
    .spread(function (client, user, order, products, payments, ewallet, store) {
      var mats = products.map(function(p) {
        return materials(p.id);
      });
      return Promise
        .all(mats)
        .then(function(mats) {
          mats.forEach(function(m, i) {
            products[i].material = m;
          });
          return sendOrder(client, user, order, products, payments, ewallet, store);
        });
    });
}

function sendOrder(client, user, order, products, payments, ewallet, store) {
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
      url: baseURL,
      image: store.logo
    },
    products: products,
    payments: payments,
    ewallet: {
      prev: ewallet.prev,
      received: ewallet.earned,
      paid: ewallet.spent,
      balance: ewallet.balance
    }
  });

  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email(user.email, user.firstName + ' ' + user.lastName);
  var to               = new helper.Email(user.email, user.firstName + ' ' + user.lastName);
  var subject          = 'Confirmación de compra';
  var content          = new helper.Content("text/html", emailBody);
  personalization.addTo(to);
  personalization.setSubject(subject);
  //
  var m = user.email == 'oreinhart@actualg.com'? 'tugorez@gmail.com': 'oreinhart@actualg.com';
  var to2              = new helper.Email(m, 'Oliver Reinhart');
  personalization.addTo(to2);
  //
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
    .then(function(quotation) {
      var client   = quotation.Client;
      var user     = quotation.User;
      var store    = quotation.Store;
      var details  = quotation.Details.map(function(detail) { return detail.id; });
      details      = QuotationDetail.find(details).populate('Product');
      return [client, user,  quotation, details, store];
    })
    .spread(function(client, user, quotation, details, store) {
      var products = details.map(function(detail) {
        var date  = moment(detail.shipDate);
        moment.locale('es');
        date.locale(false);
        date = date.format('d/MMM/YYYY');
        return {
          id: detail.Product.id,
          name:  detail.Product.ItemName,
          code:  detail.Product.ItemCode,
          color: detail.Product.DetailedColor,
          material: 'add_material',
          ewallet: detail.ewallet && detail.ewallet.toFixed(2),
          warranty: detail.Product.U_garantia.toLowerCase(),
          qty: detail.quantity,
          ship: date,
          price: numeral(detail.total).format('0,0.00'),
          image: baseURL + '/uploads/products/' + detail.Product.icon_filename
        };
      });
      return [client, user, quotation, products, store];
    })
    .spread(function(client, user, quotation, products, store) {
      var mats = products.map(function(p) {
        return materials(p.id);
      });
      return Promise
        .all(mats)
        .then(function(mats) {
          mats.forEach(function(m, i) {
            products[i].material = m;
          });
          return sendQuotation(client, user, quotation, products, store);
        });
    });
}

function sendQuotation(client, user, quotation, products, store) {
  var emailBody = quotationTemplate({
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
    quotation: {
      folio: quotation.folio,
      subtotal: numeral(quotation.subtotal).format('0,0.00'),
      discount: numeral(quotation.discount).format('0,0.00'),
      total: numeral(quotation.total).format('0,0.00'),
    },
    company: {
      url: baseURL,
      image: store.logo
    },
    products: products,
    ewallet: {
      balance: numeral(client.ewallet).format('0,0.00')
    }
  });

  // mail stuff
  var request          = sendgrid.emptyRequest();
  var requestBody      = undefined;
  var mail             = new helper.Mail();
  var personalization  = new helper.Personalization();
  var from             = new helper.Email(user.email, user.firstName + ' ' + user.lastName);
  var to               = new helper.Email(user.email, user.firstName + ' ' + user.lastName);
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
        resolve(quotation);
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
    case 'ewallet':
      payment_name = 'Monedero electrónico';
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
      payment_name = 'Cheque';
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
    case 'ewallet':
      payment_name = 'Contado';
      break;
    case '3-msi':
    case '6-msi':
    case '9-msi':
    case'12-msi':
    case'18-msi':
      payment_name = payment.type + ' ' + payment.terminal;
      break;
    case 'cheque':
      payment_name = 'Contado';
      break;
    default:
      payment_name = '';
      break;
  }
  return payment_name;
}

function materials(product) {
  var material = 'Material';
  var filter = ProductFilter
    .findOne({Name: material})
    .populate('Values')
    .then(function(filter){
      return filter.Values.map(function(v) {return v.id});
    });
  var product = Product
    .findOne(product)
    .populate('FilterValues')
    .then(function(product) {
      return product.FilterValues;
    });
  return Promise
    .all([filter, product])
    .spread(function(idfilters, pfilters) {
      return pfilters
        .filter(function(f) {
          return idfilters.indexOf(f.id) != -1;
        })
        .map(function(f) {
          return f.Name;
        })
        .join(',');
    });
}

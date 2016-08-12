var fs                = require('fs');
var ejs               = require('ejs');
var key               = process.env.SENDGRIDAPIKEY;
var sendgrid          = require('sendgrid').SendGrid(key);
var helper            = require('sendgrid').mail;
var passwordTemplate  = fs.readFileSync(sails.config.appPath + '/views/email/password/template.html').toString();
var orderTemplate     = fs.readFileSync(sails.config.appPath + '/views/email/order/template.html').toString();
var orderItemTemplate = fs.readFileSync(sails.config.appPath + '/views/email/order/item.html').toString();
passwordTemplate      = ejs.compile(passwordTemplate);
orderTemplate         = ejs.compile(orderTemplate);
orderItemTemplate     = ejs.compile(orderItemTemplate);

module.exports = {
  sendPasswordRecovery: function(userName, userEmail, recoveryUrl, cb) {
    var request         = sendgrid.emptyRequest();
    var requestBody     = undefined;
    var mail            = new helper.Mail();
    var personalization = new helper.Personalization();
    var from            = new helper.Email("noreply@actualgroup.com", "actualgroup");
    var to              = new helper.Email(userEmail, userName);
    var subject         = 'recuperar contraseña';
    var res             = passwordTemplate({
      user: userName,
      link: recoveryUrl,

      sender_name: 'Actual Studio',
      image: 'http://admin.miactual.com/assets/images/logo.png',
      sender_address: 'some address',
      sender_city: 'some city',
      sender_state: 'some state',
      sender_ip: 'some_ip',
      unsubscribe: 'some_unsubscribe'
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
  },

  sendOrderConfirmation: function(store, user, customer, order, products,  cb) {
    var request          = sendgrid.emptyRequest();
    var requestBody      = undefined;
    var mail             = new helper.Mail();
    var personalization  = new helper.Personalization();
    var from             = new helper.Email("noreply@actualgroup.com", "actualgroup");
    var to               = new helper.Email(customer.email, customer.firstName);
    var subject          = 'confirmación de compra';
    var customer         = customer.firstName;
    var shipping_address = order.address;
    var shipping_date    = new Date().toLocaleDateString();
    var order_id         = order.id;
    var products_subtotal= order.subtotal;
    var products_iva     = order.subtotal;
    var products_total   = order.total;
    var products_size    = products.length;
    var products         = products.reduce(function(acum, p){
      var product_image       = 'actual-api.herokuapp.com/uploads/products/' + p.icon_filename;
      var product_description = p.ItemName;
      var product_price       = p.Price;
      return acum + orderItemTemplate({
        product_image: product_image,
        product_description: product_description,
        product_price: product_price
      });
    }, '');
    var res              = orderTemplate({
      customer: customer,
      shipping_address: shipping_address,
      shipping_date: shipping_date,
      order_id: order_id,
      products: products,
      products_size: products_size,
      products_subtotal: products_subtotal,
      products_iva: products_iva,
      products_total: products_total,
      sender_name: 'Actual Studio',
      image: 'http://admin.miactual.com/assets/images/logo.png',
      sender_address: 'some address',
      sender_city: 'some city',
      sender_state: 'some state',
      sender_ip: 'some_ip',
      unsubscribe: 'some_unsubscribe'
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
};

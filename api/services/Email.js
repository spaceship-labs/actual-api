var fs               = require('fs');
var ejs              = require('ejs');
var key              = process.env.SENDGRIDAPIKEY;
var sendgrid         = require('sendgrid').SendGrid(key);
var helper           = require('sendgrid').mail;
var passwordTemplate = fs.readFileSync(sails.config.appPath + '/views/email/password/template.html').toString();

passwordTemplate     = ejs.compile(passwordTemplate);

module.exports = {
  sendPasswordRecovery: function(userName, userEmail, recoveryUrl, cb) {
    var request         = sendgrid.emptyRequest()
    var requestBody     = undefined;
    var mail            = new helper.Mail();
    var personalization = new helper.Personalization();
    var from            = new helper.Email("no-reply@actualgroup.com", "actualgroup");
    var to              = new helper.Email(userEmail, userName);
    var subject         = 'recuperar contraseña';
    var res             = passwordTemplate({
      user: userName,
      link: recoveryUrl,

      sender_name: 'Actual Studio',
      image: 'http://actual.spaceshiplabs.com/assets/images/logo.png',
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
      if (response.statusCode >= 200 && response.statusCode <=299) {
        cb();
      } else {
        cb(response);
      }
    });
  }
};

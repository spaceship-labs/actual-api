var key         = process.env.SENDGRIDAPIKEY;
var sendgrid    = require('sendgrid').SendGrid(key);
var helper      = require('sendgrid').mail;

module.exports = {
  sendPasswordRecovery: function(userName, userEmail, recoveryUrl, cb) {
    var request         = sendgrid.emptyRequest()
    var requestBody     = undefined;
    var mail            = new helper.Mail();
    var personalization = new helper.Personalization();
    var from            = new helper.Email("no-reply@actualgroup.com", "actualgroup");
    var to              = new helper.Email(userEmail, userName);
    var subject         = 'recuperar contraseña';
    var user            = new helper.Substitution('%user%', userName);
    var link            = new helper.Substitution('%link%', recoveryUrl);
    var content         = new helper.Content("text/html", "testing!!!")

    personalization.addTo(to);
    personalization.setSubject(subject);
    personalization.addSubstitution(user);
    personalization.addSubstitution(link);

    mail.setFrom(from);
    mail.addContent(content)
    mail.addPersonalization(personalization)
    mail.setTemplateId('82990953-d1c2-4908-b71e-2934c15d62b9');

    requestBody = mail.toJSON()
    request.method = 'POST'
    request.path = '/v3/mail/send'
    request.body = requestBody
    sendgrid.API(request, function (response) {
      if (response.statusCode >= 200 && response.statusCode <=299) {
        sails.log.info('Email: ');
        saisl.log.info(response);
        cb();
      } else {
        cb(response);
      }
    });
  }
};

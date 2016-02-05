module.exports.email = {
  service: 'mailgun',
  auth:{
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  },
  from: 'luis19prz@gmail.com',
  testMode: false
};

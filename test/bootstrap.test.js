var request = require('supertest');
var Sails = require('sails');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
//var fixtures = require('sails-fixtures');

before(function(done) {
  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(18000);

  Sails.lift(
    {
      //config for testing purposes
      connections: {
        mongodb: {
          host: process.env.MONGO_SANDBOX_HOST,
          port: process.env.MONGO_SANDBOX_PORT,
          user: process.env.MONGO_SANDBOX_USER,
          password: process.env.MONGO_SANDBOX_PASSWORD,
          database: process.env.MONGO_SANDBOX_DB,
          url: null,
        },
      },
      log: {
        level: 'warn',
      },
      /*
    fixtures: {
      order:['Store','Site', 'Company'],
      Store: require('./fixtures/stores.json'),
      Site: require('./fixtures/sites.json'),
      Company: require('./fixtures/warehouses.json')
    }
    */
    },
    async function(err, sails) {
      if (err) return done(err);
      global.app = request(sails.hooks.http.app);

      chai.use(chaiAsPromised);
      global.assert = chai.assert;
      global.expect = chai.expect;
      global.should = chai.should();
      global.sails = sails;

      global.loggedInData = false;

      const user = await User.findOne({
        email: process.env.SAMPLE_ADMIN_USER_EMAIL,
      });
      global.loggedInData = {
        token: CipherService.createToken(user),
        user: user,
      };
      done(err, sails);
    }
  );
});

after(function(done) {
  //here you can clear fixtures, etc.
  Sails.lower(done);
});

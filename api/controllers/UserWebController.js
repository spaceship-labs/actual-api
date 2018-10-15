var Promise = require('bluebird');

module.exports = {
  find: function(req, res) {
    var form = req.params.all();
    console.log('PARAMS: ', form);

    var model = 'userweb';
    var extraParams = {
      searchFields: ['firstName', 'email'],
      filters: {
        role: 'admin',
      },
    };
    form.filters = extraParams.filters;
    Common.find(model, form, extraParams)
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  findById: function(req, res) {
    var form = req.params.all();
    var id = form.id;

    var userQuery = UserWeb.findOne({ id: id, role: 'admin' });

    userQuery
      .then(function(result) {
        res.ok({ data: result });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  create: function(req, res) {
    var form = req.allParams();
    form.role = 'admin';
    UserWeb.create(form)
      .then(function(_user) {
        return res.ok({ user: _user });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  update: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    delete form.password;

    UserWeb.findOne({ id: id })
      .then(function(userToUpdate) {
        if (userToUpdate) {
          if (userToUpdate.role !== 'admin') {
            return Promise.reject(
              new Error('Solo es posible editar usuarios administradores')
            );
          }
        }

        return UserWeb.update({ id: id }, form);
      })
      .then(function(user) {
        return res.ok({
          user: user,
        });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },
};

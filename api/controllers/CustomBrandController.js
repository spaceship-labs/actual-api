module.exports = {
  async index(req, res) {
    try {
      const custombrands = await CustomBrand.find().limit(1000);
      res.ok(custombrands);
    } catch (err) {
      res.negotiate(err);
    }
  },
  async show(req, res) {
    try {
      const id = req.param('id');
      const custombrand = CustomBrand.findOne({ id });
      res.ok(custombrand);
    } catch (err) {
      res.negotiate(err);
    }
  },

  async delete(req, res) {
    try {
      const id = req.param('id');
      const custombrand = CustomBrand.destroy({ id });
      res.ok({ destroyed: true });
    } catch (err) {
      res.negotiate(err);
    }
  },

  find: function(req, res) {
    var form = req.params.all();
    var model = 'custombrand';
    var extraParams = {
      searchFields: ['Name'],
    };
    Common.find(model, form, extraParams)
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        console.log(err);
        res.notFound();
      });
  },

  create: function(req, res) {
    var form = req.params.all();
    CustomBrand.create(form)
      .then(function(created) {
        res.json(created);
      })
      .catch(function(err) {
        res.negotiate(err);
      });
  },
  async update(req, res) {
    try {
      const id = req.param('id');
      const updates = req.allParams();
      const costomBrand = await CustomBrand.update({ id }, { updates });
      res.ok(custombrand);
    } catch (err) {
      res.negotiate(err);
    }
  },
};

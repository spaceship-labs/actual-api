module.exports = {
  create: function(req, res) {
    var form = req.allParams();
    var order = form.order;
    
    //@param {string/hexadecimal} form.order
    //TODO: Cambiar order a algo mas entendible como var orderId = form.order
    Invoice
      .findOne({ order: order })
      .then(function(exists) {
        if (exists) throw new Error('invoice already exists');
        return  InvoiceService.createOrderInvoice(order);
      })
      .then(function(invoice) {
        return res.json(invoice);
      })
      .catch(function(err) {
        console.log('err invoice create', err);
        if (err.error && err.error.message) {
          err = new Error(err.error.message);
          return res.json(400, err);
        }
        if (err.error && err.error.error)  {
          err = new Error(err.error.error.message);
          return res.json(400, err);
        }
        if (err.error)  {
          err = new Error(err.error);
          return res.json(400, err);
        }
        return res.negotiate(err);
      });
  },

  find: function(req, res) {
    var form = req.allParams();
    var order = form.order;

    //@param {string/hexadecimal} form.order
    //TODO: Cambiar order a algo mas entendible como var orderId = form.order
    Invoice
      .find({ order: order })
      .then(function(order) {
        return res.json(order);
      })
      .catch(function(err) {
        return res.json(400, err);
      });
  },

  send: function(req, res) {
    var form = req.allParams();
    var order = form.order;

    //@param {string/hexadecimal} form.order
    //TODO: Cambiar order a algo mas entendible como var orderId = form.order
    InvoiceService
      .send(order)
      .then(function(order) {
        return res.json(order);
      })
      .catch(function(err) {
        if (err.error && err.error.message) {
          err = new Error(err.error.message);
          return res.negotiate(err);
        }
        if (err.error && err.error.error)  {
          err = new Error(err.error.error.message);
          return res.negotiate(err);
        }
        if (err.error)  {
          err = new Error(err.error);
          return res.negotiate(err);
        }
        return res.negotiate(err);
      });
  }
};


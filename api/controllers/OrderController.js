module.exports = {
  create: function(req, res){
    var form = req.params.all();
    Order.create(form).exec(function(err, created){
      if(err) console.log(err);
      res.json(created);
    });
  },
  addPayment: function(req, res){
    var form = req.params.all();
    var orderId = form.orderid;
    form.Order = orderid;
    Payment.create(form).exec(function(err, payment){
      Order.findOne({id: orderId}).populate('Payments').exec(function(err, order){
        if(err) console.log(err);
        var ammountPaid = order.Payments.reduce(function(paymentA, paymentB){
          return paymentA.ammount + paymentB.ammount;
        });
        var params = {
          ammountPaid: ammountPaid
        };
        sails.log.info('cantidad pagada pedido:' + ammountPaid);
        params.status = (ammountPaid / order.total >= 0.6) ? 'minimum-paid' : 'pending';
        Order.update({id:orderId}, params).exec(function(err, orderUpdated){
          if(err) console.log(err);
          res.json(orderUpdated);
        });
      });
    });
  },

  getPaymentsByOrder: function(req, res){
    var form = req.params.all();
    var orderId = form.orderid;
    Payment.find({Order: orderid}).exec(function(err, payments){
      if(err) console.log(err);
      res.json(payments);
    });
  },

  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'order';
    var searchFields = [];
    var selectFields = form.fields;
    var populateFields = ['Client'];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });

  }

}

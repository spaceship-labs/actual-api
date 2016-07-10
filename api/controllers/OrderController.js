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
      res.json(payment);
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

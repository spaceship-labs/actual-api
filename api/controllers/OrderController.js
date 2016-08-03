var _ = require('underscore');
module.exports = {
  create: function(req, res){
    var form = req.params.all();
    Order.create(form).exec(function(err, created){
      if(err) console.log(err);
      res.json(created);
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
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Order.findOne({id: id})
      .populate('Details')
      .populate('User')
      .populate('Client')
      .populate('Address')
      .populate('Payments')
      .populate('Store')
      .then(function(order){
        res.json(order);
      }).catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  createFromQuotation: function(req, res){
    var form = req.params.all();
    var quotationId = form.quotationId;
    var opts = {
      paymentGroup: form.paymentGroup || 1,
      updateDetails: true,
      currentStore: req.user.companyActive
    };
    var quotationBase = false;
    var orderCreated = false;
    Prices.updateQuotationTotals(quotationId, opts)
      .then(function(updatedQuotation){
        return Quotation.findOne({id: quotationId})
          .populate('Payments')
          .populate('Details')
          .populate('Address')
          .populate('User')
      })
      .then(function(quotation){
        quotationBase = quotation;
        var payments = quotationBase.Payments.map(function(p){return p.id});
        var orderParams = {
          ammountPaid: quotationBase.ammountPaid,
          total: quotationBase.total,
          subtotal: quotationBase.subtotal,
          discount: quotationBase.discount,
          paymentGroup: opts.paymentGroup,
          status: 'paid',
          Client: quotationBase.Client,
          Quotation: quotationId,
          Payments: quotationBase.Payments,
          User: quotationBase.User,
          Broker: quotationBase.Broker,
          Address: _.clone(quotationBase.Address.id) || false,
          CardCode: quotationBase.Address.CardCode,
          SlpCode: quotationBase.User.SlpCode,
          Store: quotationBase.User.companyActive
        };
        delete quotationBase.Address.id;
        orderParams = _.extend(orderParams, quotationBase.Address);
        return Order.create(orderParams);
      })
      .then(function(created){
        orderCreated = created;
        return Order.findOne({id:created.id}).populate('Details');
      })
      .then(function(orderFound){
        quotationBase.Details.forEach(function(d){
          delete d.id;
          orderFound.Details.add(d);
        });
        return orderFound.save();
      })
      .then(function(){
        return Quotation.update({id:quotationBase.id} , {Order: orderCreated.id});
      })
      .then(function(quotationUpdated){
        res.json(orderCreated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }

}

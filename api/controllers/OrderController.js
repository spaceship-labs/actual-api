var _ = require('underscore');
module.exports = {
  create: function(req, res){
    var form = req.params.all();
    Order.create(form)
      .then(function(order) {
        return Order.findOne(order.id).populate('User').populate('Client');
      })
      .then(function(order) {
        var user     = order.User;
        var customer = order.Client;
      })
      .then(function(store, user, customer, order, products){

      })
      .catch(function(err) {
        return res.negotiate(err);
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
    };
    var quotationBase = false;
    var orderCreated = false;
    var user = false;
      User.findOne({id:req.user.id}).populate('SlpCode')
      .then(function(u){
        opts.currentStore = u.companyActive;
        return Prices.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id: quotationId})
          .populate('Payments')
          .populate('Details')
          .populate('Address')
          .populate('User')
      })
      .then(function(quotation){
        quotationBase = quotation;
        return User.findOne({id:quotationBase.User.id}).populate('SlpCode');
      })
      .then(function(user){
        var SlpCode = -1;
        if(user.SlpCode && user.SlpCode.length > 0){
          SlpCode = user.SlpCode[0].id;
        }
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
          User: user.id,
          Broker: quotationBase.Broker,
          Address: _.clone(quotationBase.Address.id) || false,
          CardCode: quotationBase.Address.CardCode,
          SlpCode: SlpCode,
          Store: opts.currentStore,
          //Store: user.companyActive
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

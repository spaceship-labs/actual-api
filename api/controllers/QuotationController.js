var Promise = require('bluebird');
var _ = require('underscore');
var EWALLET_TYPE = 'ewallet';
var EWALLET_NEGATIVE = 'negative';

module.exports = {

  create: function(req, res){
    var form = req.params.all();
    form.Details = formatProductsIds(form.Details);
    var opts = {
      paymentGroup:1,
      updateDetails: true,
    };
    User.findOne({select:['activeStore'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.activeStore;
        form.Store = user.activeStore;
        return Quotation.create(form);
      })
      .then(function(created){
        var calculator = Prices.Calculator();
        return calculator.updateQuotationTotals(created.id, opts);
      })
      .then(function(updatedQuotation){
        if(updatedQuotation && updatedQuotation.length > 0){
          res.json(updatedQuotation[0]);
        }else{
          res.json(null);
        }
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
    };
    if(form.Details){
      form.Details = formatProductsIds(form.Details);
    }
    User.findOne({select:['activeStore'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.activeStore;
        form.Store = user.activeStore;
        return Quotation.update({id:id}, form);
      })
      .then(function(){
        var calculator = Prices.Calculator();
        return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        if(updatedQuotation && updatedQuotation.length > 0){
          res.json(updatedQuotation[0]);
        }else{
          res.json(null);
        }
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var baseQuotation = false;
    var userId = req.user.id;
    if( !isNaN(id) ){
      id = parseInt(id);
    }

    updateQuotationToLatest(id, userId, {update:true})
      .then(function(){
        return Quotation.findOne({id: id})
          .populate('Details')
          .populate('Records')
          .populate('User')
          .populate('Client')
          .populate('Order')
          .populate('Payments')
          .populate('Manager');
      })
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        }
        quotation = quotation.toObject();
        quotationBase = quotation;
        var recordsIds = [];
        quotation.Records.forEach(function(record){
          recordsIds.push(record.id);
        });
        return QuotationRecord.find({id: recordsIds}).populate('files');
      })
      .then(function(records){
        quotationBase.Records = records;
        return res.json(quotationBase);
      })
      .catch(function(err){
        console.log(err);
        return res.negotiate(err);
      });
  },

  addRecord: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var createdRecord = false;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    delete form.id;
    form.Quotation = id;

    QuotationRecord.create(form)
      .then(function(createdRecordResult){
        createdRecord = createdRecordResult;
        return QuotationRecord.findOne({id:createdRecord.id})
          .populate('User');
      })
      .then(function(foundRecord){
        createdRecord = foundRecord;
        //if(req.file('file')._files[0]){
        if(req._fileparser.upstreams.length){
          sails.log.info('adding file');

          createdRecord.addFiles(req,{
            dir : 'records/gallery',
            profile: 'gallery'
            },function(e,record){
              if(e){
                console.log(e);
                return Promise.reject(e);
              }else{
                //TODO check how to retrieve images instead of doing other query
                return QuotationRecord.findOne({id:createdRecord.id})
                  .populate('User')
                  .populate('files')
              }
          });

        }else{
          sails.log.info('not adding file');
        }
        return createdRecord;
      })
      .then(function(record){
        res.json(record);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });

  },


  addDetail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    form.Quotation = id;
    form.Details = formatProductsIds(form.Details);
    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
    };
    User.findOne({select:['activeStore'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.activeStore;
        return QuotationDetail.create(form);
      })
      .then(function(created){
         var calculator = Prices.Calculator();
         return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        if(updatedQuotation && updatedQuotation.length > 0){
          res.json(updatedQuotation[0]);
        }else{
          res.json(null);
        }
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });

  },


  removeDetailsGroup: function(req, res){
    var form = req.params.all();
    var detailsIds = form.detailsIds;
    var quotationId = form.quotation;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
    };
    User.findOne({select:['activeStore'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.activeStore;
        return QuotationDetail.destroy({id:detailsIds});
      })
      .then(function(){
        var calculator = Prices.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotation){
        if(updatedQuotation && updatedQuotation.length > 0){
          return Quotation.findOne({id: updatedQuotation[0].id}).populate('Details');
        }
        return Promise.reject('No hay cotización');
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  findByClient: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'quotation';
    var extraParams = {
      selectFields: form.fields,
      populateFields: ['Client']
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'quotation';
    var extraParams = {
      searchFields: ['DocEntry','CardCode','CardName'],
      selectFields: form.fields,
      populateFields: ['Client']
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  addPayment: function(req, res){
    var form          = req.params.all();
    var quotationId   = form.quotationid;
    var totalDiscount = form.totalDiscount || 0;
    var paymentGroup  = form.group || 1;
    var payments      = [];
    var client        = false;
    form.Quotation    = quotationId;
    if (form.Details) {
      form.Details = formatProductsIds(form.Details);
    }
    User.findOne({select:['activeStore'], id: req.user.id})
      .then(function(user){
        form.Store = user.activeStore;
        form.User = user.id;
        return Quotation.findOne(form.Quotation).populate('Client');
      })
      .then(function(quotation){
        client = quotation.Client;
        if (form.type != EWALLET_TYPE) { return; }
        if (client.ewallet < form.ammount || !client.ewallet) {
          return Promise.reject('Fondos insuficientes');
        }
        form.Client = client.id;
        return Client.update(client.id, {ewallet: client.ewallet - form.ammount});
      })
      .then(function(client){
        if(form.type == EWALLET_TYPE){
          var ewalletRecord = {
            Store: form.Store,
            Quotation: quotationId,
            User: req.userId,
            Client: client.id,
            type: EWALLET_NEGATIVE,
            amount: form.ammount
          };
          return EwalletRecord.create(ewalletRecord);
        }
        return null;
      })
      .then(function(result) {
        return Payment.create(form);
      })
      .then(function(paymentCreated){
        return Quotation.findOne({id: quotationId}).populate('Payments');
      })
      .then(function(quotation){
        payments = quotation.Payments;
        return Prices.getExchangeRate();
      })
      .then(function(exchangeRate){
        var ammounts = payments.map(function(p){
          if(p.type == 'cash-usd'){
           return p.ammount * exchangeRate;
          }
          return p.ammount;
        });
        var ammountPaid = ammounts.reduce(function(paymentA, paymentB){
          return paymentA + paymentB;
        });
        var params = {
          ammountPaid: ammountPaid,
          paymentGroup: paymentGroup
        };
        return Quotation.update({id:quotationId}, params);
      })
      .then(function(updatedQuotation){
        if(updatedQuotation && updatedQuotation.length > 0){
          res.json(updatedQuotation[0]);
        }else{
          res.json(null);
        }
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getQuotationTotals: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var paymentGroup = form.paymentGroup || 1;
    var params = {
      update: false,
      paymentGroup: paymentGroup,
    };
    User.findOne({select:['activeStore'], id: req.user.id})
      .then(function(user){
        params.currentStore = user.activeStore;
        var calculator = Prices.Calculator();
        return calculator.getQuotationTotals(id, params);
      })
      .then(function(totals){
        res.json(totals);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getRecords: function(req, res){
    var form = req.params.all();
    var id = form.id;
    QuotationRecord.find({Quotation:id})
      .populate('User')
      .populate('files')
      .then(function(records){
        res.json(records);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getCountByUser: function(req, res){
    var form = req.params.all();
    var userId = form.userId;
    var monthRange = Common.getMonthDateRange();
    //Month range by default
    var startDate = form.startDate || monthRange.start;
    var endDate = form.endDate || monthRange.end;
    var foundAll = 0;
    var queryDateRange = {
      User: userId,
      createdAt: { '>=': startDate, '<=': endDate }
    };
    Promise.props({
      foundAll: Quotation.count({User: userId}),
      foundDateRange: Quotation.count(queryDateRange)
    })
      .then(function(result){
        res.json({
          all: result.foundAll,
          dateRange: result.foundDateRange
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();
    var userId = form.userId;
    var getAll = !_.isUndefined(form.all) ? form.all : true;
    var monthRange = Common.getMonthDateRange();
    //Month range by default
    var startDate = form.startDate || monthRange.start;
    var endDate = form.endDate || monthRange.end;
    var queryDateRange = {
      User: userId,
      createdAt: { '>=': startDate, '<=': endDate }
    };
    var props = {
      totalDateRange: Quotation.find(queryDateRange).sum('total')
    };
    if(getAll){
      props.total = Quotation.find({User: userId}).sum('total');
    }
    Promise.props(props)
      .then(function(result){
        var all = 0;
        var totalDateRange = 0;
        if(getAll && result.total.length > 0){
          all = result.total[0].total;
        }
        if(result.totalDateRange.length > 0){
          totalDateRange = result.totalDateRange[0].total
        }
        res.json({
          all: all || false,
          dateRange: totalDateRange
        });
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  sendEmail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Email
      .sendQuotation(id)
      .then(function(quotation) {
        return res.json(quotation);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  updateSource: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var source = form.source;
    var params = {
      Broker: null,
      source: source
    };    
    Quotation.update({id:id}, params)
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  updateBroker: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var brokerId = form.brokerId;
    var params = {
      Broker: brokerId,
      source: null
    };
    Quotation.update({id:id}, params)
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getCurrentStock: function(req, res){
    var form = req.allParams();
    var quotationId = form.quotationId;
    var warehouse;
    Promise.join(
      User.findOne({id: req.user.id}).populate('activeStore'),
      Quotation.findOne({id: quotationId}).populate('Details')
    ).then(function(results){
      var user = results[0];
      var whsId = user.activeStore.Warehouse;
      details = results[1].Details;
      var detailsIds = details.map(function(d){ return d.id; });
      return [
        Company.findOne({id: whsId}),
        QuotationDetail.find({id: detailsIds}).populate('Product')
      ];
    })
    .spread(function(warehouse,details){
      return StockService.getDetailsStock(details, warehouse);    
    })
    .then(function(results){
      res.json(results);
    })
    .catch(function(err){
      console.log('err', err);
      res.negotiate(err);
    });

  }

};


function formatProductsIds(details){
  var result = [];
  if(details && details.length > 0){
    result = details.map(function(d){
      if(d.Product){
        d.Product = (typeof d.Product == 'string') ? d.Product :  d.Product.id;
      }
      return d;
    });
  }
  return result;
}

function updateQuotationToLatest(quotationId, userId, options){
  var params = {
    paymentGroup:1,
    updateDetails: true,
  };
  return User.findOne({select:['activeStore'], id: userId})
    .then(function(user){
      params.currentStore = user.activeStore;
      return Quotation.findOne({
        id:quotationId,
        select:['paymentGroup']
      });
    })
    .then(function(quotation){
      params.paymentGroup = quotation.paymentGroup || 1;
      var calculator = Prices.Calculator();
      return calculator.updateQuotationTotals(quotationId, params);
    });
}

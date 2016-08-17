var Promise = require('bluebird');
module.exports = {

  create: function(req, res){
    var form = req.params.all();
    form.Details = formatProductsIds(form.Details);
    var opts = {
      paymentGroup:1,
      updateDetails: true,
    };
    User.findOne({select:['companyActive'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.companyActive;
        form.Store = user.companyActive;
        return Quotation.create(form);
      })
      .then(function(created){
        return Prices.updateQuotationTotals(created.id, opts);
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
    User.findOne({select:['companyActive'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.companyActive;
        form.Store = user.companyActive;
        return Quotation.update({id:id}, form)
      })
      .then(function(){
        return Prices.updateQuotationTotals(id, opts);
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
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Quotation.findOne({id: id})
      .populate('Details')
      .populate('Records')
      .populate('User')
      .populate('Client')
      .populate('Order')
      .populate('Payments')
      .populate('Manager')
      //.populate('Address')

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
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    delete form.id;
    form.Quotation = id;
    QuotationRecord.create(form).exec( function createCB(err, createdRecord){
      if(err) console.log(err);

      QuotationRecord.findOne({id:createdRecord.id}).exec(function cb(errFind, record){
        if(errFind) console.log(errFind);

        if(req.file('file')._files[0]){
          sails.log.info('adding file');
          record.addFiles(req,{
            dir : 'records/gallery',
            profile: 'gallery'
          },function(e,record){
            if(e){
              console.log(e);
              res.json(false);
            }else{
              //TODO check how to retrieve images instead of doing other query
              QuotationRecord.findOne({id:createdRecord.id}).populate('User').populate('files').exec(function findCB(err2, recordUpdated){
                if(err2) console.log(err2);
                res.json(recordUpdated);
              });
            }
          });
        }else{
          sails.log.info('not adding file');
          res.json(record);
        }
      });
      //res.json(record);
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
    User.findOne({select:['companyActive'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.companyActive;
        return QuotationDetail.create(form);
      })
      .then(function(created){
        return Prices.updateQuotationTotals(id, opts);
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

  removeDetail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var quotationId = form.quotation;
    form.Details = formatProductsIds(form.Details);
    var opts = {
      paymentGroup:1,
      updateDetails: true,
    };
    User.findOne({select:['companyActive'], id: req.user.id})
      .then(function(user){
        opts.currentStore = user.companyActive;
        return QuotationDetail.destroy({id:id});
      })
      .then(function(){
        return Prices.updateQuotationTotals(quotationId, opts);
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

  findByClient: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'quotation';
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

  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'quotation';
    var searchFields = ['DocEntry','CardCode','CardName'];
    var selectFields = form.fields;
    var populateFields = ['Client'];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  },

  addPayment: function(req, res){
    var form          = req.params.all();
    var quotationId   = form.quotationid;
    var totalDiscount = form.totalDiscount || 0;
    var paymentGroup  = form.group || 1;
    var payments      = [];
    form.Quotation    = quotationId;
    if (form.Details) {
      form.Details = formatProductsIds(form.Details);
    }
    User.findOne({select:['companyActive'], id: req.user.id})
      .then(function(user){
        form.Store = user.companyActive;
        form.User = user.id;
        return Quotation.findOne(form.Quotation).populate('Client');
      })
      .then(function(quotation){
        var client = quotation.Client;
        if (form.type != 'monedero') { return; }
        if (client.ewallet < form.ammount || !client.ewallet) {
          return Promise.reject('Fondos insuficientes');
        }
        return Client.update(client.id, {ewallet: client.ewallet - form.ammount});
      })
      .then(function(client) {
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
        var params = {ammountPaid: ammountPaid};
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
        console.log('err');
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
    User.findOne({select:['companyActive'], id: req.user.id})
      .then(function(user){
        params.currentStore = user.companyActive;
        return Prices.getQuotationTotals(id, params);
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
      })
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();
    var userId = form.userId;
    var monthRange = Common.getMonthDateRange();
    //Month range by default
    var startDate = form.startDate || monthRange.start;
    var endDate = form.endDate || monthRange.end;
    var queryDateRange = {
      User: userId,
      createdAt: { '>=': startDate, '<=': endDate }
    };

    //Find all totals
    Promise.props({
      total: Quotation.find({User: userId}).sum('total'),
      totalDateRange: Quotation.find(queryDateRange).sum('total')
    })
      .then(function(result){
        var all = 0;
        var totalDateRange = 0;
        if(result.total.length > 0){
          all = result.total[0].total;
        }
        if(result.totalDateRange.length > 0){
          totalDateRange = result.totalDateRange[0].total
        }
        res.json({
          all: all,
          dateRange: totalDateRange
        });
      })
      .catch(function(err){
        res.negotiate(err);
      })
  },

  sendEmail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Promise.props({
      quotation: Quotation.findOne({id: id})
        .populate('User')
        .populate('Client'),
      details: QuotationDetail.find({Quotation:id})
        .populate('Product')
    })
    .then(function(result){
      var quotation = result.quotation;
      var details = result.details;
      Email.sendQuotation(
        quotation,
        quotation.User,
        quotation.Client,
        details,
        function(response){
          console.log(response);
          return res.json(response);
        }
      );
    })
    .catch(function(err){
      console.log(err);
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

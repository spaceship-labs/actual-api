var Promise = require('bluebird');
module.exports = {

  create: function(req, res){
    var form = req.params.all();
    form.Details = formatProductsIds(form.Details);
    Quotation.create(form)
      .then(function(created){
        var opts = {
          paymentGroup:1,
          updateDetails: true,
          currentStore: req.user.companyActive
        };
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
    if(form.Details){
      form.Details = formatProductsIds(form.Details);
    }
    Quotation.update({id:id}, form)
      .then(function(){
        var opts = {
          paymentGroup:1,
          updateDetails: true,
          currentStore: req.user.companyActive
        };
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
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Quotation.findOne({id: id})
      .populate('Details')
      .populate('Records')
      .populate('User')
      .populate('Client')
      //.populate('Address')
      .populate('Order')
      .populate('Payments')
      .exec(function findCB(err, quotation){
      if(err) console.log(err);

      if(quotation){
        quotation = quotation.toObject();

        var recordsIds = [];
        quotation.Records.forEach(function(record){
          recordsIds.push(record.id);
        });

        QuotationRecord.find({id: recordsIds}).populate('files').exec(function findRecordsCB(errFiles, records){
          if(errFiles) console.log(errFiles);
          quotation.Records = records;
          res.json(quotation);
        });
      }
      else{
        res.json(false);
      }
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

    QuotationDetail.create(form)
      .then(function(created){
        var opts = {
          paymentGroup:1,
          updateDetails: true,
          currentStore: req.user.companyActive
        };
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
    QuotationDetail.destroy({id:id})
      .then(function(){
        var opts = {
          paymentGroup:1,
          updateDetails: true,
          currentStore: req.user.companyActive
        };
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


  getTotalsByUser: function(req, res){
    var form = req.params.all();
    var userId = form.userid;
    //Find all totals
    Quotation.native(function(errNative, collection){
      if(errNative) console.log(errNative);
      collection.aggregate({
          $group: {_id:null, subtotal: {$sum: '$subtotal'} }
        },
        function(err, resultAll){
          if(err) console.log(err);

          //Today range
          var startDate = new Date();
          startDate.setHours(0,0,0,0);
          var endDate = new Date();
          endDate.setHours(23,59,59,999);

          //Finding by date range
          Quotation.native(function(errNative, collection){
            if(errNative) console.log(errNative);
            collection.aggregate([
                { $match: { createdAt: {$gte: startDate, $lte: endDate } } },
                { $group: {_id:null, subtotal: {$sum: '$subtotal'} } },
              ]
            , function(err, resultRangeDate){
                if(err) console.log(err);
                res.json({
                  all: resultAll || false,
                  dateRange: resultRangeDate || false
                });
            });
          });
      });
    });
  },

  addPayment: function(req, res){
    var form = req.params.all();
    var quotationId = form.quotationid;
    var totalDiscount = form.totalDiscount || 0;
    var paymentGroup = form.group || 1;
    var payments = [];
    form.Quotation = quotationId;
    if(form.Details){
      form.Details = formatProductsIds(form.Details);
    }
    Payment.create(form)
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
      currentStore: req.user.companyActive
    };
    Prices.getQuotationTotals(id, params).then(function(totals){
      res.json(totals);
    })
    .catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
  },

  getCountByUser: function(req, res){
    var form = req.params.all();
    var userId = form.userid;
    //Today range
    var startDate = new Date();
    startDate.setHours(0,0,0,0);
    var endDate = new Date();
    endDate.setHours(23,59,59,999);
    Quotation.count({User: userId}).exec(function(err, foundAll){
      if(err) console.log(err);
      var query = {
        User: userId,
        createdAt: { '>=': startDate, '<=': endDate }
      };
      Quotation.count(query).exec(function(err, foundToday){
        if(err) console.log(err);
        res.json({
          all: foundAll,
          dateRange: foundToday
        });
      });
    });
  },

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

var Promise = require('bluebird');
module.exports = {

  create: function(req, res){
    var form = req.params.all();
    form.Details = formatProductsIds(form.Details);
    Quotation.create(form).then(function(created){

      Quotation.findOne({id:created.id}).populate('Details')
      .then(function(quotation){
        var detailsIds = [];
        if(quotation.Details){
          detailsIds = quotation.Details.map(function(d){return d.id});
          return QuotationDetail.find({id:detailsIds}).populate('Product');
        }else{
          return [];
        }
      })
      .then(function(details){
        return Prices.processDetails(details)
      })
      .then(function(processedDetails){
        var totals = {
          subtotal:0,
          total:0,
          discount:0
        };
        processedDetails.forEach(function(pd){
          totals.total+= pd.total;
          totals.subtotal += pd.subtotal;
          totals.discount += (pd.subtotal - pd.total);
        });
        return Quotation.update({id:id}, totals);
      })
      .then(function(updatedQuotation){
        res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
      });


    }).catch(function(err){
      console.log(err);
    });

  },


  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var finalQuotation;
    form.Details = formatProductsIds(form.Details);
    Quotation.update({id:id}, form).then(function updateCB(updated){
      finalQuotation = updated;
      return Quotation.findOne({id:id}).populate('Details');
    })
    .then(function(quotation){
      var detailsIds = [];
      if(quotation.Details){
        detailsIds = quotation.Details.map(function(d){return d.id});
        return QuotationDetail.find({id:detailsIds}).populate('Product');
      }else{
        return [];
      }
    })
    .then(function(details){
      return Prices.processDetails(details)
    })
    .then(function(processedDetails){
      var totals = {
        subtotal:0,
        total:0,
        discount:0
      };
      processedDetails.forEach(function(pd){
        totals.total+= pd.total;
        totals.subtotal += pd.subtotal;
        totals.discount += (pd.subtotal - pd.total);
      });
      return Quotation.update({id:id}, totals);
    })
    .then(function(updatedQuotation){
      res.json(updatedQuotation);
    })
    .catch(function(err){
      console.log(err);
    });
    //Updating quotation total, with details
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
      .populate('Address')
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

    QuotationDetail.create(form).then(function(created){

      Quotation.findOne({id:form.Quotation}).populate('Details')
      .then(function(quotation){
        var detailsIds = [];
        if(quotation.Details){
          detailsIds = quotation.Details.map(function(d){return d.id});
          return QuotationDetail.find({id:detailsIds}).populate('Product');
        }else{
          return [];
        }
      })
      .then(function(details){
        return Prices.processDetails(details)
      })
      .then(function(processedDetails){
        var totals = {
          subtotal:0,
          total:0,
          discount:0
        };
        processedDetails.forEach(function(pd){
          totals.total+= pd.total;
          totals.subtotal += pd.subtotal;
          totals.discount += (pd.subtotal - pd.total);
        });
        return Quotation.update({id:id}, totals);
      })
      .then(function(updatedQuotation){
        res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
      });

    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    })

  },

  removeDetail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var quotationId = form.quotation;
    form.Details = formatProductsIds(form.Details);
    QuotationDetail.destroy({id:id}).then(function(){

      Quotation.findOne({id:quotationId}).populate('Details')
      .then(function(quotation){
        var detailsIds = [];
        if(quotation.Details){
          detailsIds = quotation.Details.map(function(d){return d.id});
          return QuotationDetail.find({id:detailsIds}).populate('Product');
        }else{
          return [];
        }
      })
      .then(function(details){
        return Prices.processDetails(details)
      })
      .then(function(processedDetails){
        var totals = {
          subtotal:0,
          total:0,
          discount:0
        };
        processedDetails.forEach(function(pd){
          totals.total+= pd.total;
          totals.subtotal += pd.subtotal;
          totals.discount += (pd.subtotal - pd.total);
        });
        return Quotation.update({id:id}, totals);
      })
      .then(function(updatedQuotation){
        res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
      });


    }); //End create detail
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

  addPayment: function(req, res){
    var form = req.params.all();
    var quotationId = form.quotationid;
    var totalDiscount = form.totalDiscount || 0;
    form.Quotation = quotationId;
    form.Details = formatProductsIds(form.Details);
    delete form.quotationid;
    delete form.cards;
    delete form.terminals;
    delete form.totalDiscount;
    Payment.create(form).exec(function(err, payment){
      Quotation.findOne({id: quotationId}).populate('Payments').exec(function(err, quotation){
        if(err) console.log(err);
        var payments = quotation.Payments.map(function(p){return p.ammount});
        var ammountPaid = payments.reduce(function(paymentA, paymentB){
          return paymentA + paymentB;
        });
        var total = quotation.subtotal - totalDiscount;
        var params = {
          ammountPaid: ammountPaid,
          totalDiscount: totalDiscount,
          total: total,
        };
        params.status = (ammountPaid / total >= 0.6) ? 'minimum-paid' : 'pending';
        Quotation.update({id:quotation.id}, params).exec(function(err, quotationUpdated){
          if(err) console.log(err);
          res.json(quotationUpdated);
        });
      });
    });
  },


};

function calculateTotal(details){
  var total = 0;
  details.forEach(function(detail){
    if(detail.Product && detail.Product.Price){
      total+= detail.Product.Price * detail.quantity;
    }
  });
  return total;
}

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

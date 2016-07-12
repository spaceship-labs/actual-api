module.exports = {

  create: function(req, res){
    var form = req.params.all();
    Quotation.create(form).exec(function createCB(err, created){
      if(err) console.log(err);

      Quotation.findOne({id:created.id}).populate('Details').exec(function(err, quotation){
        if(err) console.log(err);
        if(!quotation.Details || quotation.Details.length == 0){
          res.json(created);
        }else{
          var detailsIds = [];
          quotation.Details.forEach(function(detail){
            detailsIds.push(detail.id);
          });
          QuotationDetail.find({id:detailsIds}).populate('Product').exec(function(err2, details){
            if(err2) console.log(err2);
            var total = calculateTotal(details);

            Quotation.update({id: created.id}, {total:total}).exec(function(err, updated){
              if(err) console.log(err);
              if(Array.isArray(updated)){
                updated = updated[0];
              }
              res.json(updated);

            }); //End update price

          }); //End find details
        }

      }); //End find one

    }); //End create
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Quotation.update({id:id}, form).exec(function updateCB(err, updated){
      if(err) console.log(err);
      Quotation.findOne({id:id}).populate('Details').exec(function findOneCb(err, quotation){

        var detailsIds = [];
        quotation.Details.forEach(function(detail){
          detailsIds.push(detail.id);
        });
        QuotationDetail.find({id:detailsIds}).populate('Product').exec(function findCB(err, details){
          if(err) console.log(err);
          var total = 0;
          total = calculateTotal(details);
          Quotation.update({id:id}, {total:total}).exec(function updateCB(err, updated){
            if(err) console.log(err);
            if(Array.isArray(updated)){
              updated = updated[0];
            }
            res.json(updated);
          });
        });

      });
    });
    //Updating quotation total, with details
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Quotation.findOne({id: id}).populate('Details').populate('Records').populate('User').populate('Client').populate('Address').populate('Order').exec(function findCB(err, quotation){
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
    delete form.id;

    QuotationDetail.create(form).exec(function createCB(err, createdDetail){
      if(err) console.log(err);

      Quotation.findOne({id:form.Quotation}).populate('Details').exec(function findCB(err, quotation){
        var detailsIds = [];
        quotation.Details.forEach(function(detail){
          detailsIds.push(detail.id);
        });
        QuotationDetail.find({id:detailsIds}).populate('Product').exec(function findCB(err, details){
          if(err) console.log(err);
          var total = 0;
          total = calculateTotal(details);
          Quotation.update({id:id}, {total:total}).exec(function updateCB(err, updated){
            if(err) console.log(err);
            res.json(updated);
          }); //End update quotation total
        });//End get details

      });//End find quotation

    }); //End create detail

  },

  removeDetail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var quotationId = form.quotation;
    QuotationDetail.destroy({id:id}).exec(function destroyCB(err){
      if(err) console.log(err);

      Quotation.findOne({id:quotationId}).populate('Details').exec(function findCB(err, quotation){
        var detailsIds = [];
        quotation.Details.forEach(function(detail){
          detailsIds.push(detail.id);
        });
        QuotationDetail.find({id:detailsIds}).populate('Product').exec(function findCB(err, details){
          if(err) console.log(err);
          var total = 0;
          total = calculateTotal(details);
          Quotation.update({id:quotationId}, {total:total}).exec(function updateCB(err, updated){
            if(err) console.log(err);
            res.json(updated);
          }); //End update quotation total

        });//End get details

      });//End find quotation

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
          $group: {_id:null, total: {$sum: '$total'} }
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
                { $group: {_id:null, total: {$sum: '$total'} } },
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
    form.Quotation = quotationId;
    Payment.create(form).exec(function(err, payment){
      Quotation.findOne({id: quotationId}).populate('Payments').exec(function(err, quotation){
        if(err) console.log(err);
        var ammountPaid = quotation.Payments.reduce(function(paymentA, paymentB){
          return paymentA.ammount + paymentB.ammount;
        });
        var params = {
          ammountPaid: ammountPaid
        };
        sails.log.info('cantidad pagada cotizacion:' + ammountPaid);
        params.status = (ammountPaid / quotation.total >= 0.6) ? 'minimum-paid' : 'pending';
        Quotation.update({id:quotation}, params).exec(function(err, quotationUpdated){
          if(err) console.log(err);
          res.json(quotationUpdated);
        });
      });
    });
  },

  getPaymentsByQuotation: function(req, res){
    var form = req.params.all();
    var quotationId = form.quotationid;
    Payment.find({Quotation: quotationId}).exec(function(err, payments){
      if(err) console.log(err);
      res.json(payments);
    });
  },


};

function calculateTotal(details){
  var total = 0;
  details.forEach(function(detail){
    if(detail.Product && detail.Product.Price){
      total+= detail.Product.Price * detail.Quantity;
    }
  });
  return total;
}

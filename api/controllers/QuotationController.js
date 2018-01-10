var Promise           = require('bluebird');
var _                 = require('underscore');
var assign            = require('object-assign');
var moment            = require('moment');
var EWALLET_TYPE      = 'ewallet';
var EWALLET_NEGATIVE  = 'negative';

module.exports = {

  create: function(req, res){
    var form = req.params.all();
    var createdId;
    
    form.Details = formatProductsIds(form.Details);
    form.Store = req.user.activeStore.id;
    form.User = req.user.id;

    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStoreId: req.user.activeStore.id
    };

    Quotation.create(form)
      .then(function(created){
        createdId = created.id;
        var calculator = QuotationService.Calculator();
        if(!form.Details || form.Details.length === 0){
          opts.isEmptyQuotation = true;
        }

        return calculator.updateQuotationTotals(created.id, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id:createdId});
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err create quotation', err);
        res.negotiate(err);
      });
  },


  update: function(req, res){
    var form = req.params.all();
    var id = form.id;

    form.User = req.user.id;
    form.Store =  req.user.activeStore.id;

    Quotation.update({id:id}, form)
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

  findByIdQuickRead: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var userId = req.user.id;

    Quotation.findOne({id: id})
      .populate('Details')
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        }        
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var userId = req.user.id;
    var getPayments = form.payments;
    if( !isNaN(id) ){
      //id = parseInt(id);
    }
    
    var quotationQuery =  Quotation.findOne({id: id})
      .populate('Details')
      .populate('User')
      .populate('Client')
      .populate('Order');

    if(getPayments){
      quotationQuery.populate('Payments',{sort: 'createdAt ASC'});
    }

    var updateToLatest = QuotationService.updateQuotationToLatestData(id, userId, {
      update:true,
      currentStoreId: req.user.activeStore.id
    });


    updateToLatest.then(function(){
        return quotationQuery;
      })
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        }
        return res.json(quotation);
      })
      .catch(function(err){
        console.log('err findById quotation', err);
        return res.negotiate(err);
      });
  },

  closeQuotation: function(req, res){
    var form = req.params.all();
    var id = _.clone(form.id);
    var createdRecord = false;
    
    form.dateTime = new Date();
    form.eventType = 'Cierre';
    form.Quotation = id;
    form.User = req.user.id;

    delete form.id;
    QuotationRecord.create(form)
      .then(function(createdRecordResult){
        createdRecord = createdRecordResult;
        var updateParams = {
          isClosed: true,
          isClosedReason: form.closeReason,
          isClosedNotes: form.extraNotes,
          status: 'closed',
        };   
        //sails.log.info('createdRecord', createdRecord);
        return [
          Quotation.update({id:id},updateParams),
          QuotationRecord.findOne({id: createdRecord.id}).populate('User')
        ];
      })
      .spread(function(updateResults, record){
        var updatedQuotation = updateResults[0];
        res.json({
          quotation: updatedQuotation || false,
          record: record
        });
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  setEstimatedCloseDate: function(req, res){
    var form = req.allParams();
    var id = form.id;

    Quotation.update({id: id}, {estimatedCloseDate: form.estimatedCloseDate})
      .then(function(updated){
        if(updated.length > 0){
          res.json(updated[0].estimatedCloseDate);
        }
        else{
          res.json(false);
        }
      })
      .catch(function(err){
        console.log('err setEstimatedCloseDate', err);
        res.negotiate(err);
      });
  },

  addRecord: function(req, res){
    var form = req.allParams();
    var id = form.id;
    var createdRecord = false;
    var addedFile = false;
    var updatedQuotation = false;
    var promises = [];
    if( !isNaN(id) ){
      //id = parseInt(id);
    }
    delete form.id;
    form.Quotation = id;

    QuotationRecord.create(form)
      .then(function(createdRecordResult){
        createdRecord = createdRecordResult;
        
        return QuotationRecord.findOne({id:createdRecord.id}).populate('User');
      })
      .then(function(foundRecord){
        createdRecord = foundRecord;

        //if(req.file('file')._files[0]){
        if(req._fileparser.upstreams.length){

          var options = {
            dir : 'records/gallery',
            profile: 'record'            
          };

          return createdRecord.addFiles(req, options)
            .then(function(recordWithFiles){
              return QuotationRecord.findOne({id:createdRecord.id})
                .populate('User')
                .populate('files');
            });

        }else{
          //sails.log.info('not adding file');
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
    form.shipDate = moment(form.shipDate).startOf('day').toDate();

    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStoreId: req.user.activeStore.id
    };
    
    QuotationDetail.create(form)
      .then(function(created){
         var calculator = QuotationService.Calculator();
         return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id: id});
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err addDetail quotation', err);
        res.negotiate(err);
      });

  },

  addMultipleDetails: function(req, res){
    var form = req.params.all();
    var id = form.id;
    form.Quotation = id;
    form.Details = formatProductsIds(form.Details);
    
    if(form.Details && form.Details.length > 0 && _.isArray(form.Details) ){
      form.Details = form.Details.map(function(d){
        d.shipDate = moment(d.shipDate).startOf('day').toDate();
        return d;
      });
    }

    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStoreId: req.user.activeStore.id
    };
    
    QuotationDetail.create(form.Details)
      .then(function(created){
         var calculator = QuotationService.Calculator();
         return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id: id});
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err addDetail quotation', err);
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
      currentStoreId: req.user.activeStore.id
    };

    QuotationDetail.destroy({id:detailsIds})
      .then(function(){
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotationResult){
        return Quotation.findOne({id: quotationId}).populate('Details');
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
    form.filters = form.filters || {};

    var client = form.client;
    var model = 'quotation';
    var clientSearch = form.clientSearch;
    var clientSearchFields = ['CardName', 'E_Mail'];
    var preSearch = Promise.resolve();

    if(clientSearch && form.term){
      preSearch = clientsIdSearch(form.term, clientSearchFields);
      delete form.term;
    }

    var extraParams = {
      searchFields: ['folio','id'],
      selectFields: form.fields,
      populateFields: ['Client']
    };

      preSearch.then(function(preSearchResults){
        //Search by pre clients search
        if( preSearchResults && _.isArray(preSearchResults) ){
          form.filters.Client = preSearchResults;
        }

        return Common.find(model, form, extraParams);
      })
      .then(function(result){
        res.ok(result);
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
      currentStoreId: req.user.activeStore.id
    };
    var calculator = QuotationService.Calculator();
    console.log('params', params);

    calculator.getQuotationTotals(id, params)
      .then(function(totals){
        res.json(totals);
      })
      .catch(function(err){
        console.log('err getQuotationTotals', err);
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
    var form    = req.params.all();
    var options = form;
    QuotationService.getCountByUser(options)
      .then(function(count){
        res.json(count);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();
    var options = form;
    QuotationService.getTotalsByUser(options)
      .then(function(totals){
        res.json(totals);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getMultipleUsersTotals: function(req, res){
    var form = req.params.all();
    var options = form;
    QuotationService.getMultipleUsersTotals(options)
      .then(function(totals){
        res.json(totals);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  sendEmail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var activeStore = req.user.activeStore;
    Email
      .sendQuotation(id, activeStore)
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
    var sourceType = form.sourceType;

    var params = {
      Broker: null,
      source: source,
      sourceType: sourceType
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
      source: 'Broker'
      //source: null
    };
    BrokerSAP.findOne({id:brokerId})
      .then(function(brokerFound){
        if(!brokerFound){
          return Promise.reject(new Error('No existe este broker'));
        }

        params.brokerCode = brokerFound.Code;

        return Quotation.update({id:id}, params);
      })
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
    var details;
    QuotationDetail.find({Quotation: quotationId}).populate('Product')
      .then(function(detailsFound){
        details = detailsFound;
        var whsId = req.user.activeStore.Warehouse;
        return Company.findOne({id: whsId});
      })
      .then(function(warehouse){
        return StockService.getDetailsStock(details, warehouse);    
      })
      .then(function(results){
        res.json(results);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });

  },

  validateStock: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    StockService.validateQuotationStockById(quotationId, req.user.activeStore)
      .then(function(isValid){
        return res.json({isValid: isValid});
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  getQuotationPaymentOptions: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    Quotation.findOne({id:quotationId})
      .then(function(quotation){
        var options = {
          financingTotals: form.financingTotals || false
        };
        return PaymentService.getMethodGroupsWithTotals(quotationId, req.user.activeStore, options);
      })
      .then(function(paymentOptions){
        res.json(paymentOptions);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getQuotationSapLogs: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    SapOrderConnectionLog.find({Quotation:quotationId})
      .then(function(logs){
        res.json(logs);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getQuotationPayments: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    Payment.find({Quotation: quotationId}).sort('createdAt ASC')
      .then(function(payments){
        res.json(payments);
      })
      .catch(function(err){
        console.log('err',err)
        res.negotiate(err);
      });
  }

};

function clientsIdSearch(term, searchFields){
  var query = {};
  if(searchFields.length > 0){
    query.or = [];
    for(var i=0;i<searchFields.length;i++){
      var field = searchFields[i];
      var obj = {};
      obj[field] = {contains:term};
      query.or.push(obj);
    }
  }
  return Client.find(query)
    .then(function(clients){
      if(!clients){
        return [];
      }
      return clients.map(function(c){return c.id;});
    });
}

function tagImmediateDeliveriesDetails(details){
  if(details && details.length > 0){
    for(var i=0;i<details.length;i++){
      if(Shipping.isDateImmediateDelivery(details[i].shipDate)){
        details[i].immediateDelivery = true;
      }
    }
    return details;
  }
  return [];
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

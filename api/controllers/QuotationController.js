var Promise           = require('bluebird');
var _                 = require('underscore');
var moment            = require('moment');

module.exports = {

  async create(req, res){
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

    try{
      const createdQuotation = await Quotation.create(form);
      const calculator = QuotationService.Calculator();
      if(!form.Details || form.Details.length === 0){
        opts.isEmptyQuotation = true;
      }

      const updatedQuotation = await calculator.updateQuotationTotals(createdQuotation.id, opts);
      const quotation = await Quotation.findOne({id:createdId});
      return res.json(quotation);
    }
    catch(err){
      console.log('err create quotation', err);
      return res.negotiate(err);
    }
  },


  async update(req, res){
    var form = req.allParams();
    var id = form.id;
    form.Store =  req.user.activeStore.id;
    //Never update the quotation User
    if(form.User){
      delete form.User;
    }

    try{
      const updatedQuotations = await Quotation.update({id:id}, form)
      if(updatedQuotations && updatedQuotations.length > 0){
        return res.json(updatedQuotations[0]);
      }else{
        return res.json(null);
      }
    }catch(err){
      console.log(err);
      return res.negotiate(err);
    }
  },

  async findByIdQuickRead(req, res){
    try{
      const {id} = req.allParams();
      const quotation = await Quotation.findOne({id: id});
      if(!quotation){
        return res.negotiate(new Error('Cotización no encontrada'));
      }        
      res.json(quotation);
    }
    catch(err){
      console.log('err', err);
      res.negotiate(err);      
    }
  },

  async findById(req, res){
    const form = req.allParams();
    var userId = req.user.id;    
    const {id} = form;
    const arePaymentsRequired = form.payments;
    var quotation;
    try{
      const options = {
        update:true,
        currentStoreId: req.user.activeStore.id
      };

      const totals = await QuotationService.updateQuotationToLatestData(id, userId, options);
      if(arePaymentsRequired){
        quotation = await Quotation.findOne({id: id})
        .populate('Details')
        .populate('User')
        .populate('Client')
        .populate('Order')   
        .populate('Payments',{sort: 'createdAt ASC'});
      }
      else{
        quotation = await Quotation.findOne({id: id})
        .populate('Details')
        .populate('User')
        .populate('Client')
        .populate('Order');
      }

      if(!quotation){
        return Promise.reject(new Error('Cotización no encontrada'));
      }
      return res.json(quotation);
    }
    catch(err){
      console.log('err findById quotation', err);
      return res.negotiate(err);  
    }
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
    form.User = req.user.id;

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


  async addDetail(req, res){
    var form = req.allParams();
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
    
    try{
      const createdDetails = await QuotationDetail.create(form);
      const calculator = QuotationService.Calculator();
      const updatedQuotation = await calculator.updateQuotationTotals(id, opts);
      const quotation = await Quotation.findOne({id: id});  
      return res.json(quotation);
    }catch(err){
      console.log('err addDetail quotation', err);
      return res.negotiate(err);
    }

  },

  async addMultipleDetails(req, res){
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
    
    try{
      const createdDetails = await QuotationDetail.create(form.Details)
      const calculator = QuotationService.Calculator();
      const updatedQuotation = await calculator.updateQuotationTotals(id, opts);
      const quotation = await Quotation.findOne({id: id});
      return res.json(quotation);
    }catch(err){
      console.log('err addDetail quotation', err);
      return res.negotiate(err);
    }
  },  

  async removeDetailsGroup(req, res){
    const form = req.allParams();
    const detailsIds = form.detailsIds;
    const quotationId = form.quotation;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStoreId: req.user.activeStore.id
    };

    try{
      await QuotationDetail.destroy({id:detailsIds});
      const calculator = QuotationService.Calculator();
      const updatedQuotationResult = await calculator.updateQuotationTotals(quotationId, opts);
      const quotation = await Quotation.findOne({id: quotationId}).populate('Details');
      return res.json(quotation);
    }catch(err){
      console.log(err);
      res.negotiate(err);
    }
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

  async getQuotationTotals(req, res){
    var form = req.params.all();
    const id = form.id;
    const paymentGroup = form.paymentGroup || 1;
    var params = {
      update: false,
      paymentGroup: paymentGroup,
      currentStoreId: req.user.activeStore.id
    };
    const calculator = QuotationService.Calculator();
    console.log('params', params);

    try{
      const totals = await calculator.getQuotationTotals(id, params);
      return res.json(totals);
    }catch(err){
      console.log('err getQuotationTotals', err);
      return res.negotiate(err);
    }
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

  async getQuotationPaymentOptions(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    const quotation = await Quotation.findOne({id:quotationId})
    const options = {
      financingTotals: form.financingTotals || false
    };
    try{
      const paymentOptions = await PaymentService.getQuotationTotalsByMethod(quotation.id, req.user.activeStore, options);
      return res.json(paymentOptions);
    }catch(err){
      console.log(err);
      return res.negotiate(err);
    }
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

module.exports = {

  create: function(req, res){
    var form = req.params.all();
    res.json(true);
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Quotation.findOne({id: id}).populate('Details').populate('Records').populate('Info').exec(function findCB(err, quotation){
      if(err) console.log(err);

        //sails.log.debug(quotation)
      if(quotation){

        var recordsIds = [];
        quotation.Records.forEach(function(record){
          recordsIds.push(record.id);
        });

        QuotationRecord.find({id: recordsIds}).populate('files').exec(function findRecordsCB(errFiles, records){

          quotation = quotation.toObject();
          quotation.Records = records;

          Client.findOne({CardCode: quotation.CardCode}).exec(function findClientCB(err2, client ){
            if(err2) console.log(err2);
            quotation.Client = client;

            User.findOne({SlpCode: quotation.SlpCode}).exec( function findUserCB(err3, user){
              if(err3) console.log(err3);

              if(!user){

                Seller.findOne({SlpCode: quotation.SlpCode}).exec( function findSellerCB(err4, seller){
                  quotation.Seller = seller;
                  res.json(quotation);
                });

              }else{
                quotation.Seller = user;
                res.json(quotation);
              }
            });

          });

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

  updateInfo: function(req, res){
    var form = req.params.all();
    var DocEntry = form.docentry;
    if( !isNaN(DocEntry) ){
      form.Quotation = parseInt(DocEntry);
    }
    var query = {Quotation: DocEntry};
    delete form.docentry;
    QuotationInfo.findOrCreate(query, form).exec(function cb(err, quotationInfo){
      if(err) console.log(err);
      //If not created
      if(quotationInfo.id == form.id){
        QuotationInfo.update(query, form).exec(function cbUpdate(err2, quotationInfoUpdated){
          if(err2) console.log(err2);
          res.json(quotationInfoUpdated);
        });
      }else{
        res.json(quotationInfo);
      }
    });
  },


  findByClient: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'quotation';
    var searchFields = [];
    var selectFields = form.fields;
    var populateFields = [];
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
    var populateFields = [];
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  }

};

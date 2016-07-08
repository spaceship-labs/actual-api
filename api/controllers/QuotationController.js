module.exports = {

  create: function(req, res){
    var form = req.params.all();
    Quotation.create(form).exec(function createCB(err, created){
      if(err) console.log(err);
      res.json(created);
    });
  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Quotation.update({id:id}, form).exec(function updateCB(err, updated){
      if(err) console.log(err);
      res.json(updated);
    });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Quotation.findOne({id: id}).populate('Details').populate('Records').populate('User').exec(function findCB(err, quotation){
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
    QuotationDetail.create(form).exec(function addCB(err, created){
      if(err) console.log(err);
      res.json(created);
    });
  },

  removeDetail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    QuotationDetail.destroy({id: id}).exec(function removeCB(err){
      if(err) console.log(err);
      res.json({destroyed:true});
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
    var populateFields = ['Client'];
    sails.log.info('populateFields');
    sails.log.info(populateFields);
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  }

};

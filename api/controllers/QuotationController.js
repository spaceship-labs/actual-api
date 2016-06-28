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
    Quotation.findOne({id: id}).populate('Details').populate('Records').exec(function findCB(err, quotation){
      if(err) console.log(err);

        var recordsIds = [];
        quotation.Records.forEach(function(record){
          recordsIds.push(record.id);
        });

        QuotationRecord.find({id: recordsIds}).populate('files').populate('User').exec(function findRecordsCB(errFiles, records){

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
      QuotationRecord.findOne({id:createdRecord.id}).populate('User').populate('files').exec(function findCB(err2, record){
        if(err2) console.log(err2);
        res.json(record);
      });
      //res.json(record);
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

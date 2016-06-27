module.exports = {

  create: function(req, res){
    var form = req.params.all();
    res.json(true);
    /*
    Quotation.create(form).exec(function(err1, result){
      if(err1) console.log(err1);
      if(result){
        res.json(result);
      }
      else{
        res.json(false);
      }
    });
    */
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Quotation.findOne({DocEntry: id}).populate('Client').exec(function findCB(err, quotation){
      if(err) console.log(err);
      Client.findOne({CardCode: quotation.CardCode}).exec(function findClientCB(err2, client ){
        if(err2) console.log(err2);
        quotation.Client = client;

        var query = {DocEntry: id};
        //sails.log.info('query');
        //sails.log.info(query);
        QuotationDetail.find(query).exec(function findDetailsCB(errD, details){
          if(errD) console.log(errD);
          //sails.log.info('details');
          //sails.log.info(details);
          quotation.Details = details;

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

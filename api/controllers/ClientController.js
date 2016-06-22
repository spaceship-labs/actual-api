
module.exports = {
  findBySeller: function(req, res){
    var form = req.params.all();
    var model = 'client';
    var searchFields = ['CardCode','CardName'];
    var selectFields =[];
    var populateFields = ['Quotations'];
    form.filters = {SlpCode: form.seller};
    Common.find(model, form, searchFields, populateFields, selectFields).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    })
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    //Product.find({id:id}).exec(function(err, results){
    Client.findOne({CardCode:id})
      //.populate('Groups')
      //.populate('stock')
      .exec(function(err, client){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        res.json(client);
      }
    });
  },

};

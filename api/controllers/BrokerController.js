module.exports = {
	list: function(req, res){
    var form  = req.params.all();
    var page  = form.page;
    var limit = form.limit;
    var find = BrokerSAP.find();

    if(limit && page){
      find = find.paginate({page:page, limit:limit});
    }

    find.then(function(brokers){
        return res.json(brokers);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
	},
};
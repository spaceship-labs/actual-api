module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var items = form.items || 10;
    var page = form.page || 0;
    var skip = page;

    console.log('skip:' + skip);
    Product.find({ limit:items, skip: skip}).exec(function(err, products){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        res.ok({data:products});
      }
    });
  }
}

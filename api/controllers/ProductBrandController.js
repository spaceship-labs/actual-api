module.exports = {
  getAll: function(req, res){
    ProductBrandColor.find({}).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        return res.ok(results);
      }
    })
  }
}

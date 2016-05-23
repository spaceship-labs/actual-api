module.exports = {
  getAll: function(req, res){
    ProductBrand.find({}).limit(500).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        console.log(results.length);
        return res.ok(results);
      }
    })
  }
}

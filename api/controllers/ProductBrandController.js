module.exports = {
  getAll: function(req, res){
    ProductBrand.find({}).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        return res.ok(results);
      }
    })
  }
}

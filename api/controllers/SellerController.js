module.exports = {
  getAll: function(req, res){
    Seller.find({}).populate('User').limit(1000).exec(function(err, results){
      if(err){
        console.log(err);
        res.notFound();
      }else{
        return res.ok(results);
      }
    })
  }
}
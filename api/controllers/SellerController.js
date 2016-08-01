module.exports = {
  getAll: function(req, res){
    Seller.find({}).populate('User').exec(function(err, results) {
      if(err){
        return res.notFound();
      }else{
        return res.ok(results);
      }
    });
  },

  getAllUnselected: function(req, res) {
    Seller.find({User: null}).exec(function(err, results) {
      if(err){
        return res.notFound();
      }else{
        return res.ok(results);
      }
    });
  }
}

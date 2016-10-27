module.exports = {
  getAll: function(req, res){
    Seller.find({}).populate('User')
      .then(function(results) {
        return res.ok(results);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getAllUnselected: function(req, res) {
    Seller.find({User: null})
      .then(function(results) {
        return res.ok(results);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }
};

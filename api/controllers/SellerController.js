var NOT_SELLER_ID = '5780465889c75aed0816f81f';
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

  getAllUnselected: function(req, res){
    var allSellersIds = [];
    var usedSellersIds = [];
    User.find({}).then(function(users){
      usedSellersIds = users.reduce(function(acum,user){
        if(user.Seller){
          acum.push(user.Seller);
        }
        return acum;
      },[]);

      var notSellerIndex = usedSellersIds.indexOf(NOT_SELLER_ID);
      if( notSellerIndex > -1 ){
        usedSellersIds.splice(notSellerIndex, 1);
      }
      return Seller.find({id:{'!': usedSellersIds}});
    })
    .then(function(unselectedSellers){
      res.json(unselectedSellers);
    })
    .catch(function(err){
      console.log('err', err);
      return res.negotiate(err);
    });
  }

};

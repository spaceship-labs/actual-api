module.exports = {
  /*
  cuadros: function(req, res){
    ProductCategory.findOne({id:"57436fb9ef7d5e62e508e206"}) //Cuadros
      .populate('Products')
      .then(function(category){
        var prods = category.Products;

        var categories = ['57436fb9ef7d5e62e508e1cb','57bb19c25c90d40c00c732cb', '57436fb9ef7d5e62e508e206']; //decoracion y decoracion de paredes, cuadors
        var prodsIds = prods.map(function(p){return p.id});
        return Product.update({id:prodsIds},{Categories: categories});
      })
      .then(function(updated){
        res.json(updated.length);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  */


};

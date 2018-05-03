/**
 * FeaturedProductController
 *
 * @description :: Server-side logic for managing Featuredproducts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async index(req, res) {
    try {
      const site = req.param('site');
      const featuredProducts = await FeaturedProduct.find({ site }).populate(
        'product'
      );
      console.log(featuredProducts);
      res.ok(featuredProducts);
    } catch (err) {
      res.negotiate(err);
    }
  },
  async create(req, res) {
    try {
      const featuredProduct = await FeaturedProduct.create(req.allParams());
      res.created(featuredProduct);
    } catch (err) {
      res.negotiate(err);
    }
  },
};

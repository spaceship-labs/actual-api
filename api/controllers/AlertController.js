/**
 * AlertController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async index(req, res) {
    try {
      const { page = 1, limit = 10 } = req.allParams();
      const alerts = await Alert.find().paginate({ page, limit });
      res.ok(alerts);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

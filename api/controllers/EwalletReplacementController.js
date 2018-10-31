/**
 * EwalletReplacementController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async index(req, res) {
    try {
      const replacements = await EwalletReplacement.find()
        .populate('Client')
        .populate('Store')
        .populate('requestedBy');
      res.ok(replacements);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

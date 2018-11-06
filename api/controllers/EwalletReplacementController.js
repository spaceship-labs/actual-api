/**
 * EwalletReplacementController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async index(req, res) {
    try {
      const model = 'ewalletreplacement';
      const extraParams = { searchFields: ['status'] };
      const replacements = await EwalletService.customFind(
        req.allParams(),
        extraParams,
        model
      );
      console.log(('replacements', replacements));
      res.ok(replacements);
    } catch (error) {
      res.negotiate(error);
    }
  },

  async update(req, res) {
    try {
      console.log('req.user', req.user);
      const id = req.param('id');
      const approvedAt = new Date();
      const replacement = await EwalletReplacement.update(
        { id },
        { approvedAt, approvedBy: req.user, status: 'approved' }
      );
      res.ok(replacement);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

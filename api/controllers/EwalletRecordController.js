/**
 * EwalletRecordController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async index(req, res) {
    try {
      const model = 'ewalletrecord';
      const extraParams = { searchFields: ['cardNumber'] };
      const ewallets = await EwalletService.customFind(
        req.allParams(),
        extraParams,
        model
      );
      res.ok(ewallets);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

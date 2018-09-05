/**
 * EwalletConfigurationController
 *
 * @description :: Server-side logic for managing Ewalletconfigurations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async show(req, res) {
    try {
      const ewalletConfiguration = await EwalletConfiguration.find();
      res.ok(ewalletConfiguration);
    } catch (error) {
      res.negotiate(error);
    }
  },

  async update(req, res) {
    try {
      const id = req.param('id');
      const {
        exchangeRate,
        expirationDate,
        minimumPercentageToGeneratePoints,
      } = req.allParams();
      const ewalletConfiguration = await EwalletConfiguration.update(
        { id },
        { exchangeRate, expirationDate, minimumPercentageToGeneratePoints }
      );
      res.ok(ewalletConfiguration);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

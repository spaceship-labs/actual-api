/**
 * EwalletConfigurationController
 *
 * @description :: Server-side logic for managing Ewalletconfigurations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async show(req, res) {
    try {
      const id = req.param('id');
      const ewalletConfiguration = await EwalletConfiguration.findOne({ id });
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
        maximumPercentageToGeneratePoints,
      } = req.allParams();
      const ewalletConfiguration = await EwalletConfiguration.findOrCreate(
        { id },
        { exchangeRate, expirationDate, maximumPercentageToGeneratePoints }
      );
      res.ok(ewalletConfiguration);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

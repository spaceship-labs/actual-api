/**
 * EwalletConfigurationController
 *
 * @description :: Server-side logic for managing Ewalletconfigurations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
const moment = require('moment');

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
        maximumPercentageToGeneratePoints,
      } = req.allParams();
      const ewalletConfiguration = await EwalletConfiguration.update(
        { id },
        { 
          exchangeRate, 
          expirationDate: moment(expirationDate).format("YYYY-MM-DD HH:mm"), 
          maximumPercentageToGeneratePoints 
        }
      );
      res.ok(ewalletConfiguration);
    } catch (error) {
      res.negotiate(error);
    }
  },

  async create(req, res) {
    try {
      const ewalletConfiguration = await EwalletConfiguration.create(
        req.allParams()
      );
      res.ok(ewalletConfiguration);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

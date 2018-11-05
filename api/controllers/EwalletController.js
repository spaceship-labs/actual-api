/**
 * EwalletController
 *
 * @description :: Server-side logic for managing Ewallets
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async index(req, res) {
    try {
      const model = 'ewallet';
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
  async showOrCreate(req, res) {
    try {
      const cardNumber = req.param('cardNumber');
      const Client = req.param('client');
      console.log('req.user', req.user);
      const storeId = req.user.activeStore.id;
      const ewallet = await EwalletService.showOrCreate(
        cardNumber,
        Client,
        storeId
      );
      res.ok(ewallet);
    } catch (e) {
      res.negotiate(e);
    }
  },
  async show(req, res) {
    try {
      const cardNumber = req.param('cardNumber');
      if (cardNumber.length < 12) throw new Error('Formato no válido');
      const ewallet = await Ewallet.findOne({ cardNumber });
      if (!ewallet)
        throw new Error('El monedero electrónico ingresado no existe ');
      const ewalletConfiguration = await EwalletConfiguration.find();
      ewallet.exchangeRate = ewalletConfiguration[0].exchangeRate;
      res.ok(ewallet);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

/**
 * EwalletController
 *
 * @description :: Server-side logic for managing Ewallets
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async showOrCreate(req, res) {
    try {
      const cardNumber = req.param('cardNumber');
      const Client = req.param('client');
      const ewallet = await EwalletService.showOrCreate(cardNumber, Client);
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
      res.ok(ewallet);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

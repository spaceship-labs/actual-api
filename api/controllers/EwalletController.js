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
      if (cardNumber.length < 12) throw new Error('Formato no válido');
      const ewallet = await Ewallet.findOne({ cardNumber });
      if (ewallet) {
        if (ewallet.Client === Client) {
          res.ok(ewallet);
        } else {
          throw new Error(
            'El monedero ingresado no pertenece al usuario de esta cotización'
          );
        }
      } else {
        const ewalletCreated = await Ewallet.create({
          Client,
          cardNumber,
          amount: 0,
        });
        res.ok(ewalletCreated);
      }
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

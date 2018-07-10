/**
 * EwalletController
 *
 * @description :: Server-side logic for managing Ewallets
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async show(req, res) {
    try {
      const cardNumber = req.param('cardNumber');
      if (cardNumber.length < 12)
        throw new Error({ message: 'Formato no válido' });
      const ewallet = await Ewallet.findOrCreate(
        { cardNumber },
        { cardNumber, amount: 0 }
      );
      res.ok(ewallet);
    } catch (e) {
      console.log(e);
      res.notFound();
    }
  },
};

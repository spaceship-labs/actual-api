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
      const type = req.param('type');
      let ewallet;
      const cardNumber = req.param('cardNumber');
      const Client = req.param('client');
      const storeId = req.user.activeStore.id;
      if (type === 'show') {
        if (cardNumber.length < 12) throw new Error('Formato no válido');
        ewallet = await Ewallet.findOne({ cardNumber });
        if (!ewallet)
          throw new Error('El monedero electrónico ingresado no existe ');
      } else {
        ewallet = await EwalletService.showOrCreate(
          cardNumber,
          Client,
          storeId
        );
      }
      const ewalletConfiguration = await EwalletConfiguration.find();
      ewallet.exchangeRate = ewalletConfiguration[0].exchangeRate;
      res.ok(ewallet);
    } catch (e) {
      res.negotiate(e);
    }
  },
  async show(req, res) {
    try {
      const cardNumber = req.param('cardNumber');
      const ewalletConfiguration = await EwalletConfiguration.find();
      ewallet.exchangeRate = ewalletConfiguration[0].exchangeRate;
      res.ok(ewallet);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async getById(req, res) {
    try {
      const id = req.param('id');
      const ewallet = await Ewallet.findOne({ id });
      res.ok(ewallet);
    } catch (e) {
      res.negotiate(e);
    }
  },
  async addFile(req, res) {
    try {
      const clientId = req.param('clientId');
      const options = {
        dir: 'ewallet/attach',
      };
      const files = await Files.saveFiles(req, options);
      const fileLoaded = await EwalletFile.create({
        filename: files[0].filename,
        filepath: files[0].fd,
      });
      await Client.update({ id: clientId }, { EwalletContract: fileLoaded.id });

      res.ok(fileLoaded);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

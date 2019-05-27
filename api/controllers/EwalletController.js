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
      let ewallet;
      const cardNumber = req.param('cardNumber');
      const clientId = req.param('client');
      const storeId = req.user.activeStore.id;
      ewallet = await Ewallet.findOne({ cardNumber });
      if (ewallet && ewallet.Client === clientId) {
        ewallet.exchangeRate = EwalletService.getExchangeRate();
        res.ok(ewallet);
      } else if (ewallet && ewallet.Client !== clientId) {
        throw new Error('El monedero ingresado no pertenece a este cliente ');
      } else if (!ewallet) {
        const client = await Client.findOne({ id: clientId });
        if (client.Ewallet)
          throw new Error(
            'El cliente ya cuenta con un monedero favor de verificar'
          );
        if (!client.EwalletContract)
          throw new Error('Favor de cargar un contrato antes de continuar');
        if (cardNumber.length < 12) throw new Error('Formato no válido');
        ewallet = await Ewallet.create({
          Client: clientId,
          Store: storeId,
          cardNumber,
        });
        ewallet.exchangeRate = EwalletService.getExchangeRate();
        res.ok(ewallet);
      }
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

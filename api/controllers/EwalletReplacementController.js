/**
 * EwalletReplacementController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async index(req, res) {
    try {
      const model = 'ewalletreplacement';
      const extraParams = { searchFields: ['status'] };
      const replacements = await EwalletService.customFind(
        req.allParams(),
        extraParams,
        model
      );
      res.ok(replacements);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async update(req, res) {
    try {
      const id = req.param('id');
      const approvedAt = new Date();
      const { amount, Client } = await EwalletReplacement.findOne({
        id,
      }).populate('Client');
      const replacement = await EwalletReplacement.update(
        { id },
        { approvedAt, approvedBy: req.user, status: 'approved' }
      );
      await Ewallet.update({ Client: Client.id }, { amount });
      res.ok(replacement);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async add(req, res) {
    try {
      const clientId = req.param('clientId');
      const storeId = req.user.activeStore.id;
      const options = {
        dir: 'ewallet/replacement',
      };
      const files = await Files.saveFiles(req, options);
      console.log('files', files);
      const fileLoaded = await ReplacementFile.create({ filename: files[0] });
      const ewallet = await Ewallet.findOne({ Client: clientId });
      const replacementFound = await EwalletReplacement.findOne({
        Ewallet: ewallet.id,
      }).populate('Files');
      if (replacementFound) {
        replacementFound.Files.add(fileLoaded.id);
        await replacementFound.save();
        res.ok(replacementFound);
      } else if (!replacementFound) {
        const replacement = await EwalletReplacement.create({
          amount: ewallet.amount,
          Ewallet: ewallet.id,
          Client: clientId,
          Store: storeId,
          requestedBy: req.user,
          Files: [fileLoaded.id],
        });
        await Client.update({ id: clientId }, { Ewallet: null });
        await Ewallet.update(
          { id: ewallet.id },
          { Client: null, active: false, amount: 0 }
        );
        res.ok(replacement);
      }
    } catch (error) {
      res.negotiate(error);
    }
  },
};

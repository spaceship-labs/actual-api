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
      const status = req.param('status');
      const approvedAt = new Date();
      let replacement;
      if (status === 'rejected') {
        replacement = await EwalletReplacement.update(
          { id },
          { approvedAt, approvedBy: req.user, status }
        );
      } else if (status === 'approved') {
        const { Client } = await EwalletReplacement.findOne({
          id,
        }).populate('Client');
        const { amount } = await Ewallet.findOne({ ReplacementRequests: id });
        replacement = await EwalletReplacement.update(
          { id },
          { approvedAt, approvedBy: req.user, status }
        );
        await Ewallet.update({ Client: Client.id }, { amount });
      }
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
      const fileLoaded = await ReplacementFile.create({
        filename: files[0].filename,
        filepath: files[0].fd,
      });
      const ewallet = await Ewallet.findOne({ Client: clientId });
      const replacementFound = await EwalletReplacement.findOne(
        ewallet
          ? {
              Ewallet: ewallet.id,
            }
          : {
              Client: clientId,
            }
      )
        .populate('Files')
        .populate('Ewallet');
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
          { Client: null, active: false }
        );
        res.ok(replacement);
      }
    } catch (error) {
      res.negotiate(error);
    }
  },
};

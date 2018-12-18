/**
 * OrderCancelationController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  async index(req, res) {
    try {
      const { page = 1, limit = 10 } = req.allParams();
      const orderCancelations = await OrderCancelation.find()
        .populate('Order')
        .paginate({
          page,
          limit,
        });
      const total = await OrderCancelation.count();
      const results = { orderCancelations, total };
      res.ok(results);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async show(req, res) {
    try {
      const id = req.param('id');
      const cancelationOrder = await OrderCancelation.findOne({ id })
        .populate('Order')
        .populate('Details')
        .populate('CancelationDetails');
      sails.log(cancelationOrder);
      res.ok(cancelationOrder);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async add(req, res) {
    try {
      const orderId = req.param('orderId');
      const { cancelAll, details, reason } = req.allParams();
      const orderCancelation = await CancelationService.addCancelation(
        orderId,
        cancelAll,
        details,
        reason
      );
      res.ok(orderCancelation);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async update(req, res) {
    try {
      const cancelationId = req.param('id');
      const { detailApprovement, requestStatus } = req.allParams();
      console.log('detailApprovement: ', detailApprovement);
      console.log('requestStatus: ', requestStatus);
      const orderCancelationUpdated = await CancelationService.updateRequest(
        cancelationId,
        detailApprovement,
        requestStatus
      );
      res.ok(orderCancelationUpdated);
    } catch (error) {
      res.negotiate(error);
    }
  },
};

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
      const orderCancelations = await OrderCancelation.find().paginate({
        page,
        limit,
      });
      res.ok(orderCancelations);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async show(req, res) {
    try {
      const id = req.param('id');
      const cancelationOrder = await OrderCancelation.findOne({ id })
        .populate('Order')
        .populate('Details');
      res.ok(cancelationOrder);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async add(req, res) {
    try {
      const orderId = req.params('orderId');
      const { cancelAll, details, reason } = req.allParams();
      const detailsIds = details.map(detail => detail.id);
      details.map(async detail => {
        const orderDetail = await OrderDetail.findOne({ id: detail.id });
        await OrderDetail.update(
          { id: orderDetail },
          { quantityToCancel: detail.quantity }
        );
      });
      const orderCancelation = await OrderCancelation.create({
        cancelAll,
        reason,
        status: 'requested',
        Details: detailsIds,
        Order: orderId,
      });
      res.ok(orderCancelation);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async update(req, res) {
    try {
      const cancelationId = req.param('id');
      const { detailsApprovement, requestStatus } = req.allParams();
      const orderCancelationUpdated = await CancelationService.updateRequest(
        cancelationId,
        detailsApprovement,
        requestStatus
      );
      res.ok(orderCancelationUpdated);
    } catch (error) {
      res.nogotiate(error);
    }
  },
};

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
        .populate('Details');
      res.ok(cancelationOrder);
    } catch (error) {
      res.negotiate(error);
    }
  },
  async add(req, res) {
    try {
      const orderId = req.param('orderId');
      const { cancelAll, details, reason } = req.allParams();
      let detailsIds;
      if (cancelAll === true) {
        const { Details } = await Order.findOne({ id: orderId }).populate(
          'Details'
        );
        detailsIds = Details.map(detail => detail.id);
        Details.map(async detail => {
          const orderDetail = await OrderDetail.findOne({ id: detail.id });
          await OrderDetail.update(
            { id: orderDetail.id },
            { quantityToCancel: orderDetail.quantity }
          );
        });
      } else if (cancelAll === false) {
        detailsIds = details.map(detail => detail.id);
        details.map(async detail => {
          const orderDetail = await OrderDetail.findOne({ id: detail.id });
          await OrderDetail.update(
            { id: orderDetail.id },
            { quantityToCancel: detail.quantity }
          );
        });
      }
      const orderCancelation = await OrderCancelation.create({
        cancelAll,
        reason,
        status: 'pending',
        Details: detailsIds,
        Order: orderId,
      });
      // await SapService.throwAlert(params);
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

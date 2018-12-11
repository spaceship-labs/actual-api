const addCancelation = async (orderId, cancelAll, details, reason) => {
  let detailsIds;
  if (cancelAll === true) {
    const { Details } = await Order.findOne({ id: orderId }).populate(
      'Details'
    );
    detailsIds = Details.map(detail => detail.id);
    Details.map(
      async ({ id, quantity }) =>
        await OrderDetailCancelation.create({
          quantity: quantity,
          Order: orderId,
          Detail: id,
        })
    );
  } else if (cancelAll === false) {
    detailsIds = details.map(detail => detail.id);
    details.map(
      async ({ id, quantity }) =>
        await OrderDetailCancelation.create({
          quantity: quantity,
          Order: orderId,
          Detail: id,
        })
    );
  }

  const cancelationDetails = await OrderDetailCancelation.find({
    Order: orderId,
  });
  const cancelationDetailsIds = cancelationDetails.map(detail => detail.id);
  const orderCancelation = await OrderCancelation.create({
    cancelAll,
    reason,
    Details: detailsIds,
    Order: orderId,
    CancelationDetails: cancelationDetailsIds,
  });
  return orderCancelation;
};

const createCancelationDetails = async details =>
  details.map(async detail => {
    await OrderDetailCancelation.create({
      quantity: detail.quantity,
      Order: orderId,
      Detail: detail.id,
    });
  });

const updateRequest = async (
  cancelationId,
  detailsApprovement,
  requestStatus
) => {
  const {
    id,
    Details,
    Order,
    cancelAll,
    CancelationDetails,
  } = await OrderCancelation.findOne({
    id: cancelationId,
  })
    .populate('Details')
    .populate('Order')
    .populate('CancelationDetails');
  if (requestStatus === 'rejected') {
    CancelationDetails.map(async detail => {
      await OrderDetailCancelation.update(
        { id: detail.id },
        { status: 'rejected' }
      );
    });
    return await OrderCancelation.update({ id }, { status: 'reviewed' });
  }
  if (requestStatus === 'authorized') {
    CancelationDetails.map(async ({ id, quantity }) => {
      const { id: OrderDetailId, quantityCanceled } = await OrderDetail.findOne(
        detail.Detail
      );
      await OrderDetailCancelation.update({ id: id }, { status: 'authorized' });
      await OrderDetail.update(
        { id: OrderDetailId },
        {
          quantityCanceled:
            quantityCanceled > 0 ? quantityCanceled + quantity : quantity,
        }
      );
    });
    await Order.update(
      { id: Order.id },
      cancelAll === true && requestStatus === 'authorized'
        ? {
            status: 'canceled',
            ammountPaid: 0,
          }
        : {
            status: 'partiallyCanceled',
          }
    );

    return await OrderCancelation.update({ id }, { status: 'reviewed' });
  }
  detailsApprovement.map(async ({ id, status }) => {
    const { Detail, quantity } = await OrderDetailCancelation.findOne({ id });
    const { id: OrderDetailId, quantityCanceled } = await OrderDetail.findOne(
      Detail
    );
    await OrderDetailCancelation.update({ id }, { status });
    await OrderDetail.update(
      { id: OrderDetailId },
      {
        quantityCanceled:
          quantityCanceled > 0 ? quantityCanceled + quantity : quantity,
      }
    );
  });
  await Order.update(
    { id: Order.id },
    cancelAll === true && requestStatus === 'authorized'
      ? {
          status: 'canceled',
          ammountPaid: 0,
        }
      : {
          status: 'partiallyCanceled',
        }
  );

  return await OrderCancelation.update({ id }, { status: 'reviewed' });
};

module.exports = {
  addCancelation: addCancelation,
  updateRequest: updateRequest,
  createCancelationDetails: createCancelationDetails,
};

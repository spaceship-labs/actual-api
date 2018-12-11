const addCancelation = async (orderId, cancelAll, details, reason) => {
  let detailsIds;
  if (cancelAll === ('true' || true)) {
    const { Details } = await Order.findOne({ id: orderId }).populate(
      'Details'
    );
    Details.map(
      async ({ id, quantity }) =>
        await OrderDetailCancelation.create({
          quantity: quantity,
          Order: orderId,
          Detail: id,
        })
    );
    detailsIds = Details.map(({ id }) => id);
  } else {
    details.map(
      async ({ id, quantity }) =>
        await OrderDetailCancelation.create({
          quantity: quantity,
          Order: orderId,
          Detail: id,
        })
    );
    detailsIds = details.map(({ id }) => id);
  }
  const orderCancelation = await OrderCancelation.create({
    cancelAll: cancelAll === 'true' ? true : false,
    reason,
    Details: detailsIds,
    Order: orderId,
  });
  const cancelationDetails = await OrderDetailCancelation.find({
    Order: orderId,
  });
  const cancelationDetailsIds = cancelationDetails.map(({ id }) => id);
  const orderCancelationWithDetails = await OrderCancelation.update(
    { id: orderCancelation.id },
    {
      CancelationDetails: cancelationDetailsIds,
    }
  );
  return orderCancelationWithDetails;
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
    CancelationDetails.map(async ({ id }) => {
      await OrderDetailCancelation.update({ id }, { status: 'rejected' });
    });
    return await OrderCancelation.update({ id }, { status: 'reviewed' });
  }
  if (requestStatus === 'authorized') {
    CancelationDetails.map(async ({ id, quantity, Detail }) => {
      const { id: OrderDetailId, quantityCanceled } = await OrderDetail.findOne(
        Detail
      );
      await OrderDetailCancelation.update({ id }, { status: 'authorized' });
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

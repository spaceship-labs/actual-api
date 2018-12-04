const updateRequest = async (
  cancelationId,
  detailsApprovement,
  requestStatus
) => {
  const orderCancelation = await orderCancelation
    .findOne({ id: cancelationId })
    .populate('Details')
    .populate('Order');
  if (requestStatus === 'rejected') {
    orderCancelation.Details.map(
      async detail =>
        await OrderDetail.update(
          { id: detail.id },
          { cancelationStatus: false }
        )
    );
    return await orderCancelation.update(
      { id: orderCancelation.id },
      { status: 'reviewed' }
    );
  }
  if (requestStatus === 'authorized') {
    orderCancelation.Details.map(
      async detail =>
        await OrderDetail.update(
          { id: detail.id },
          {
            cancelationStatus: true,
            quantityCanceled: detail.quantityToCancel,
          }
        )
    );
  }
  detailsApprovement.map(async detailApprovement => {
    if (detailApprovement.authorized === true) {
      const detail = await OrderDetail.findOne({ id: detailApprovement.id });
      await OrderDetail.update(
        { id: detail.id },
        {
          cancelationStatus: true,
          quantityCanceled: detail.quantityToCancel,
        }
      );
    }
    if (detailApprovement.authorized === false) {
      const detail = await OrderDetail.findOne({ id: detailApprovement.id });
      await OrderDetail.update(
        { id: detail.id },
        {
          cancelationStatus: false,
        }
      );
    }
  });
  await Order.update(
    { id: orderCancelation.Order.id },
    orderCancelation.cancelAll === true
      ? {
          status: 'canceled',
          ammountPaid: 0,
        }
      : {
          status: 'partiallyCanceled',
        }
  );
  return await orderCancelation.update(
    { id: orderCancelation.id },
    { status: 'reviewed' }
  );
};
module.exports = {
  updateRequest: updateRequest,
};

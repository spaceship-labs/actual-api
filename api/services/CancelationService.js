const updateRequest = async (
  cancelationId,
  detailsApprovement,
  requestStatus
) => {
  const { id, Details, Order, cancelAll } = await OrderCancelation.findOne({
    id: cancelationId,
  })
    .populate('Details')
    .populate('Order');
  if (requestStatus === 'rejected') {
    Details.map(
      async detail =>
        await OrderDetail.update(
          { id: detail.id },
          { cancelationStatus: false }
        )
    );
    return await OrderCancelation.update({ id }, { status: 'reviewed' });
  }
  if (requestStatus === 'authorized') {
    Details.map(
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
  updateRequest: updateRequest,
};

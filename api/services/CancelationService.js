const BigNumber = require('bignumber.js');

const createCancelationDetails = async (
  { id, quantity },
  orderId,
  cancelID
) => {
  const detail = await OrderDetail.findOne({ id }).populate(
    'CancelationDetails'
  );
  const { id: newCancelDetailID } = await OrderDetailCancelation.create({
    quantity: quantity,
    Order: orderId,
    Detail: id,
    Cancelation: cancelID,
  });
  detail.CancelationDetails.add(newCancelDetailID);
  await detail.save();
};

const validateCancelDetailStatus = ({ status, quantity }) =>
  status === 'pending' || status === 'authorized' ? quantity : 0;

const add = (total, number) => total + number;

const getCanceledQuantity = details =>
  details.map(validateCancelDetailStatus).reduce(add, 0);

const updateDetailAvailableQuantity = async ({
  id,
  quantity,
  quantityCanceled,
  detailsCanceled,
}) =>
  await OrderDetail.update(
    { id },
    { quantityAvailable: quantity - quantityCanceled - detailsCanceled }
  );

const compareDetailsQuantity = async details =>
  details.map(async ({ id, quantity, quantityCanceled }) => {
    const {
      CancelationDetails: cancelationDetails,
    } = await OrderDetail.findOne({ id }).populate('CancelationDetails');
    await updateDetailAvailableQuantity({
      id,
      quantity,
      quantityCanceled,
      detailsCanceled: getCanceledQuantity(cancelationDetails),
    });
  });

const getCanceledAmount = async details =>
  details.reduce(
    (
      total,
      {
        quantityCanceled: quantityCancelDetail,
        total: totalCancelDetail,
        quantity: quantityDetail,
      }
    ) => {
      const quantityCanceled = new BigNumber(quantityCancelDetail);
      const quantity = new BigNumber(quantityDetail);
      const totalCancel = new BigNumber(totalCancelDetail);
      const amount = totalCancel
        .dividedBy(quantity)
        .multipliedBy(quantityCanceled)
        .toNumber();
      console.log('amount: ', amount);
      return total + amount ? parseFloat(amount) : 0;
    },
    0
  );

const addCancelation = async (orderId, cancelAll, details, reason) => {
  let detailsIds;
  const orderCancelation = await OrderCancelation.create({
    cancelAll: cancelAll,
    reason,
    Order: orderId,
  });
  if (cancelAll === true || cancelAll === 'true') {
    const { Details, totalProducts } = await Order.findOne({
      id: orderId,
    }).populate('Details');
    Details.map(
      async detail =>
        await createCancelationDetails(detail, orderId, orderCancelation.id)
    );
    detailsIds = Details.map(({ id }) => id);
  } else {
    details.map(
      async detail =>
        await createCancelationDetails(detail, orderId, orderCancelation.id)
    );
    detailsIds = details.map(({ id }) => id);
  }
  const cancelationDetails = await OrderDetailCancelation.find({
    Cancelation: orderCancelation.id,
  });
  const cancelationDetailsIds = cancelationDetails.map(({ id }) => id);
  const cancel = await OrderCancelation.findOne({ id: orderCancelation.id })
    .populate('CancelationDetails')
    .populate('Details');
  cancel.CancelationDetails.add(cancelationDetailsIds);
  await cancel.save();
  cancel.Details.add(detailsIds);
  await cancel.save();
  return await OrderCancelation.findOne({ id: orderCancelation.id });
};

const updateRequest = async (
  cancelationId,
  detailsApprovement,
  requestStatus
) => {
  const {
    id,
    Details,
    Order: orderCancel,
    cancelAll,
    CancelationDetails,
  } = await OrderCancelation.findOne({
    id: cancelationId,
  })
    .populate('Details')
    .populate('Order')
    .populate('CancelationDetails');
  const { amountCanceled: amountCanceledBefore, ammountPaid } = orderCancel;
  const amountCanceled = await getCanceledAmount(Details);
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
      { id: orderCancel.id },
      cancelAll === true && requestStatus === 'authorized'
        ? {
            status: 'canceled',
            ammountPaid: 0,
          }
        : {
            amountCanceled:
              amountCanceledBefore > 0
                ? amountCanceledBefore + amountCanceled
                : amountCanceled,
            ammountPaid:
              amountCanceledBefore > 0
                ? ammountPaid - (amountCanceledBefore + amountCanceled)
                : ammountPaid - amountCanceled,
            status: 'partiallyCanceled',
          }
    );

    return await OrderCancelation.update({ id }, { status: 'reviewed' });
  }
  if (requestStatus === 'partially') {
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
      { id: orderCancel.id },
      {
        amountCanceled:
          amountCanceledBefore > 0
            ? amountCanceledBefore + amountCanceled
            : amountCanceled,
        ammountPaid:
          amountCanceledBefore > 0
            ? ammountPaid - (amountCanceledBefore + amountCanceled)
            : ammountPaid - amountCanceled,
        status: 'partiallyCanceled',
      }
    );

    return await OrderCancelation.update({ id }, { status: 'reviewed' });
  }
};

module.exports = {
  addCancelation: addCancelation,
  updateRequest: updateRequest,
  createCancelationDetails: createCancelationDetails,
  getCanceledAmount: getCanceledAmount,
  compareDetailsQuantity: compareDetailsQuantity,
};

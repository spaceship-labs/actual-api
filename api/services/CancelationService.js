const BigNumber = require('bignumber.js');
const _ = require('underscore');
const Promise = require('bluebird');

const createCancelationDetails = async (
  { id, quantity },
  orderId,
  cancelID
) => {
  const detail = await OrderDetail.findOne({ id }).populate(
    'CancelationDetails'
  );
  const total = new BigNumber(detail.quantity)
    .dividedBy(detail.quantity)
    .multipliedBy(quantity)
    .toNumber();
  const { id: newCancelDetailID } = await OrderDetailCancelation.create({
    quantity: quantity,
    Product: detail.Product,
    shipDate: detail.shipDate,
    shipCompanyFrom: detail.shipCompanyFrom,
    Order: orderId,
    Detail: id,
    Cancelation: cancelID,
    total,
  });

  detail.CancelationDetails.add(newCancelDetailID);
  await detail.save();
};

const validateCancelDetailStatus = ({ status, quantity }) =>
  status === 'pending' || status === 'authorized' ? quantity : 0;

const add = (total, number) => total + number;

const getCanceledQuantity = details =>
  details.map(validateCancelDetailStatus).reduce(add, 0);

const updateDetailAvailableQuantity = async ({ id, quantity }) =>
  await OrderDetail.update(
    { id },
    {
      quantityAvailable: quantity,
    }
  );

const compareDetailsQuantity = async details =>
  details.map(async ({ id, quantity, quantityCanceled = 0 }) => {
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
      return total + amount ? parseFloat(amount) : 0;
    },
    0
  );

const addCancelation = async (orderId, cancelAll, details, reason) => {
  let detailsIds;
  const { Quotation: quotationID, CardName } = await Order.findOne({
    id: orderId,
  });
  const { id: orderCancelationID } = await OrderCancelation.create({
    cancelAll: cancelAll,
    reason,
    Order: orderId,
    Quotation: quotationID,
    CardName,
  });
  if (cancelAll === true || cancelAll === 'true') {
    const { Details } = await Order.findOne({
      id: orderId,
    }).populate('Details');
    Details.map(
      async detail =>
        await createCancelationDetails(detail, orderId, orderCancelationID)
    );
    detailsIds = Details.map(({ id }) => id);
  } else {
    details.map(
      async detail =>
        await createCancelationDetails(detail, orderId, orderCancelationID)
    );
    detailsIds = details.map(({ id }) => id);
  }
  const cancelationDetails = await OrderDetailCancelation.find({
    Cancelation: orderCancelationID,
  });
  const cancelationDetailsIds = cancelationDetails.map(({ id }) => id);
  const cancel = await OrderCancelation.findOne({ id: orderCancelationID })
    .populate('CancelationDetails')
    .populate('Details');
  cancel.CancelationDetails.add(cancelationDetailsIds);
  await cancel.save();
  cancel.Details.add(detailsIds);
  await cancel.save();
  return await OrderCancelation.findOne({ id: orderCancelationID });
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
  console.log('cancelationId', cancelationId);

  if (requestStatus === 'rejected') {
    CancelationDetails.map(async ({ id }) => {
      await OrderDetailCancelation.update({ id }, { status: 'rejected' });
    });
    await OrderCancelation.update({ id }, { status: 'reviewed' });
    return await OrderCancelation.findOne({ id })
      .populate('Order')
      .populate('Details')
      .populate('CancelationDetails');
  }
  if (requestStatus === 'authorized') {
    const action =
      cancelAll === true && requestStatus === 'authorized' ? 'delete' : 'edit';
    const authorizedDetails = await SapService.cancelOrder(
      orderCancel.id,
      action,
      id,
      requestStatus,
      detailsApprovement
    );

    const authorizedProducts = [];

    authorizedDetails.map(item => {
      item.map(product => {
        authorizedProducts.push(product);
      });
    });

    const authorizedCancelationDetails = CancelationDetails.filter(
      ({ Detail }) => {
        const data = authorizedProducts.find(({ id }) => id === Detail);
        return data;
      }
    );

    const quantityCancel = authorizedCancelationDetails.reduce(
      (total, { quantity }) => {
        return total + quantity;
      }
    );

    const getAmount = await getAmountCanceled(authorizedCancelationDetails);

    const resultupdate = await Promise.all(
      authorizedCancelationDetails.map(async ({ id }) => {
        const {
          Detail,
          quantity: quantitycancel,
        } = await OrderDetailCancelation.findOne({ id });
        console.log('updating...');
        await updateOrderDetail(Detail, quantitycancel, id);
      })
    );

    const resultordet = await amountCancelation(
      orderCancel.id,
      getAmount,
      cancelAll,
      requestStatus,
      quantityCancel
    );

    await OrderCancelation.update({ id }, { status: 'reviewed' });
    return await OrderCancelation.findOne({ id })
      .populate('Order')
      .populate('Details')
      .populate('CancelationDetails');
  }
  if (requestStatus === 'partially') {
    const action = 'edit';
    const authorizedProduct = [];
    const rejectedProduct = [];

    detailsApprovement.map(item => {
      if (item.status !== 'rejected') {
        authorizedProduct.push(item);
      } else {
        rejectedProduct.push(item);
      }
    });

    const authorizedDetails = await SapService.cancelOrder(
      orderCancel.id,
      action,
      id,
      requestStatus,
      authorizedProduct
    );

    const authorizedProductSap = [];
    authorizedDetails.map(item => {
      item.map(product => {
        authorizedProductSap.push(product);
      });
    });

    const authorizedCancelationDetails = CancelationDetails.filter(
      ({ Detail }) => {
        const data = authorizedProductSap.find(({ id }) => id === Detail);
        return data;
      }
    );

    const quantityCancel = authorizedCancelationDetails.reduce(
      (total, { quantity }) => {
        return total + quantity;
      }
    );
    const getAmount = await getAmountCanceled(authorizedCancelationDetails);

    await Promise.all(
      rejectedProduct.map(async ({ id, status }) => {
        await OrderDetailCancelation.update({ id }, { status: status });
        const { Detail } = await OrderDetailCancelation.findOne({ id });
        const { quantity } = await OrderDetail.findOne(Detail);
        await OrderDetail.update(
          { id: Detail },
          {
            quantityAvailable: quantity,
          }
        );
      })
    );

    const resultupdate = await Promise.all(
      authorizedCancelationDetails.map(async ({ id }) => {
        const {
          Detail,
          quantity: quantitycancel,
        } = await OrderDetailCancelation.findOne({ id });
        console.log('updating...');
        await updateOrderDetail(Detail, quantitycancel, id);
      })
    );

    const resultordet = await amountCancelation(
      orderCancel.id,
      getAmount,
      cancelAll,
      requestStatus,
      quantityCancel
    );

    await OrderCancelation.update({ id }, { status: 'reviewed' });

    return await OrderCancelation.findOne({ id })
      .populate('Order')
      .populate('Details')
      .populate('CancelationDetails');
  }
};

const getAmountCanceled = async authorizedDetails => {
  const totalCancelAmount = await Promise.all(
    authorizedDetails.map(async ({ Detail, total: quantitycancel }) => {
      const { unitPriceWithDiscount } = await OrderDetail.findOne(Detail);
      return { quantitycancel, unitPriceWithDiscount };
    })
  );
  const result = totalCancelAmount.reduce(
    (total, { unitPriceWithDiscount, quantitycancel }) => {
      return total + unitPriceWithDiscount * quantitycancel;
    },
    0
  );

  console.log('result', result);
  return result;
};

const updateOrderDetail = async (Detail, quantitycancel, id) => {
  const {
    quantityCanceled,
    quantity,
    unitPriceWithDiscount,
    unitPrice,
    discount: discountCanceledBefore,
  } = await OrderDetail.findOne(Detail);
  const discount =
    discountCanceledBefore / quantity * (quantity - quantitycancel);
  

  await OrderDetailCancelation.update({ id }, { status: 'authorized' });
  await OrderDetail.update(
    { id: Detail },
    {
      quantityCanceled: quantitycancel,
      quantity: quantity - quantitycancel,
      quantityAvailable: quantity - quantitycancel,
      discount: discount,
      subtotal: parseFloat(unitPrice * (quantity - quantitycancel)),
      subtotal2: parseFloat(
        unitPriceWithDiscount * (quantity - quantitycancel)
      ),
      totalPg1: parseFloat(unitPriceWithDiscount * (quantity - quantitycancel)),
      total: parseFloat(unitPriceWithDiscount * (quantity - quantitycancel)),
    }
  );
  return true;
};

const amountCancelation = async (
  orderID,
  totalCanceled,
  cancelAll,
  requestStatus,
  quantityCancel
) => {
  const {
    Details,
    amountCanceled: amountCanceledBefore,
    ammountPaid: ammountPaidBefore,
    Client: client,
    totalProductsCancel: totalProductsCancelBefore,
    totalProducts: totalProductsBefore,
  } = await Order.findOne(orderID).populate('Details');

  const subTotal = Details.reduce((total, { total: totalDetail }) => {
    return total + totalDetail;
  }, 0);

  const discounts = Details.reduce((total, { discount, quantity }) => {
    return total + discount * quantity;
  }, 0);
  console.log('Subtotal: ', subTotal, ' Discount: ', discounts);

  await Order.update(
    { id: orderID },
    cancelAll === true && requestStatus === 'authorized'
      ? {
          status: 'canceled',
          amountCanceled: parseFloat(ammountPaidBefore),
          ammountPaid: parseFloat(0.0),
          total: parseFloat(0.0),
          subtotal: parseFloat(0.0),
          totalProductsCancel: totalProductsBefore,
        }
      : {
          amountCanceled: parseFloat(amountCanceledBefore + totalCanceled),
          ammountPaid: parseFloat(ammountPaidBefore - totalCanceled),
          subtotal: subTotal,
          total: subTotal - discounts,
          status: 'partiallyCanceled',
          totalProductsCancel: totalProductsCancelBefore + quantityCancel,
        }
  );
  const { Balance: balanceBefore } = await Client.findOne({ id: client });
  console.log('balance', balanceBefore);

  await Client.update(
    { id: client },
    { Balance: balanceBefore + totalCanceled }
  );
  const { Balance } = await Client.findOne({ id: client });
  console.log('Balance', Balance);
};

const getCancelDetails = async ids => {
  const orderCancelations = await OrderCancelation.find({
    id: ids,
  }).populate('CancelationDetails');

  const cancelationDetails = orderCancelations.map(
    ({ CancelationDetails }) => CancelationDetails
  );
  let details = cancelationDetails.map(Detail =>
    Detail.map(({ Detail, quantity, status }) => ({
      Detail,
      quantity,
      status,
    }))
  );
  details = details[0];
  return _.union(details);
};

module.exports = {
  addCancelation,
  updateRequest,
  createCancelationDetails,
  getCanceledAmount,
  compareDetailsQuantity,
  getCancelDetails,
};

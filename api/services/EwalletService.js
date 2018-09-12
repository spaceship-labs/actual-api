var EWALLET_NEGATIVE = 'negative';
var EWALLET_TYPE = 'ewallet';
var Promise = require('bluebird');

module.exports = {
  applyEwalletRecord: applyEwalletRecord,
  isValidEwalletPayment: isValidEwalletPayment,
  async showOrCreate(cardNumber, clientId) {
    if (cardNumber.length < 12) throw new Error('Formato no válido');
    const ewallet = await Ewallet.findOne({ cardNumber });
    const client = await Client.findOne({ id: clientId });
    console.log('client.Ewallet: ', client);
    if (ewallet) {
      console.log('ENTRA IF EWALLET');
      if (ewallet.Client === clientId) {
        return ewallet;
      } else {
        throw new Error(
          'El monedero ingresado no pertenece al cliente de esta cotización'
        );
      }
    } else if (client.Ewallet) {
      console.log('ENTRA IF EWALLET CLIENT');
      console.log('client.Ewallet: ', client.Ewallet);
      throw new Error(
        'El cliente ya tiene un monedero relacionado, intente de nuevo'
      );
    } else {
      console.log('entra else');
      const ewalletCreated = await Ewallet.create({
        Client: clientId,
        cardNumber,
        amount: 0,
      });
      await Client.update({ id: clientId }, { Ewallet: ewalletCreated.id });
      return ewalletCreated;
    }
  },
};

const validateBarcodeFormat = cardNumber => {
  if (cardNumber.length < 12) throw new Error('Formato no válido');
};
function isValidEwalletPayment(paymentAmount, ewalletAmount) {
  if (ewalletAmount < paymentAmount || !ewalletAmount) {
    return false;
  }
  return true;
}

async function applyEwalletRecord(payment, options, ewalletAmount, ewalletId) {
  if (ewalletAmount < payment.ammount || !ewalletAmount) {
    return Promise.reject(
      new Error('Fondos insuficientes en monedero electronico')
    );
  }
  const updatedAmount = ewalletAmount - payment.ammount;
  console.log('updatedAmount: ', updatedAmount);
  console.log('ewalletAmount: ', ewalletAmount);
  console.log('payment.ammount: ', payment.ammount);
  console.log('ewalletId: ', ewalletId);
  if (payment.type == EWALLET_TYPE) {
    const ewalletRecordParams = {
      Store: payment.Store,
      Quotation: options.quotationId,
      User: options.userId,
      Payment: options.paymentId,
      movement: 'decrease',
      amount: payment.ammount,
    };

    const { id } = await EwalletRecord.create(ewalletRecordParams);

    const ewallet = await Ewallet.update(
      { id: ewalletId },
      { EwalletRecord: id, amount: updatedAmount }
    );
    console.log('EWALLET FINAL: ', ewallet);
  } else {
    return null;
  }
}

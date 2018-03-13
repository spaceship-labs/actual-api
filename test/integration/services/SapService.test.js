const moment = require('moment');

describe("SapService", function(){
  describe("mapPaymentsToSap", function(){
    it("should map correctly payments to sap request format, filtering client balance, client credit payments and canceled payments", function(){
      const payments = [
        {id:"payment.id.1", type: "cash", ammount: 500},
        {id:"payment.id.2", type: "cash", ammount: 1500, status: "canceled"},
        {id:"payment.id.3", type: "cash-usd", ammount: 100, currency: "usd" },
        {id:"payment.id.4", type: "client-balance", ammount: 350},       
        {id:"payment.id.5", type: "credit-card", ammount: 250, terminal: "american-express", verificationCode: "1241"},
        {id:"payment.id.6", type: "client-credit", ammount: 450}        
      ];

      const exchangeRate = 18.50;

      const expected = [
        {
          TypePay: payments[0].type, 
          PaymentAppId: payments[0].id, 
          amount: payments[0].ammount
        }, 
        {
          TypePay: payments[2].type, 
          PaymentAppId: payments[2].id, 
          amount: payments[2].ammount,
          rate: exchangeRate
        },
        {
          TypePay: payments[4].type, 
          PaymentAppId: payments[4].id, 
          amount: payments[4].ammount,
          CardNum: '4802', 
          CardDate: '05/16', 
          Terminal: payments[4].terminal, 
          ReferenceTerminal: payments[4].verificationCode,
          DateTerminal: moment().format(SapService.SAP_DATE_FORMAT)
        },                 
      ];
      
      expect(SapService.mapPaymentsToSap(payments, exchangeRate)).to.deep.equal(expected);
    });
  });
});
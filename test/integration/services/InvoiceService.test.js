describe("InvoiceService", function(){
  describe("getHighestPayment", function(){
    it("should get the highest payment", function(){
      const payments = [
        {type: "cash", currency: "mxn", ammount: 2000},
        {type: "cash-usd", currency: "usd", ammount: 400, exchangeRate: 18.20},
        {type: "cash", currency: "mxn", ammount: 4000}
      ];
      expect(InvoiceService.getHighestPayment(payments))
        .to.deep.equal(payments[1]);
    });
  });

  describe("getPaymentMethodBasedOnPayments", function(){
    it("should get the debit-card payment method, taking the highest", function(){
      const payments = [
        {type: "cash", currency: "mxn", ammount: 2000},
        {type: "cash-usd", currency: "usd", ammount: 400, exchangeRate: 18.20},
        {type: "debit-card", currency: "mxn", ammount: 14000}
      ];
      expect(InvoiceService.getPaymentMethodBasedOnPayments(payments))
        .to.equal('debit-card');
    });

    it("should get the cash payment method, taking the highest, ignoring client balance and client credit methods", function(){
      const payments = [
        {type: "cash", currency: "mxn", ammount: 2000},
        {type: "cash-usd", currency: "usd", ammount: 400, exchangeRate: 18.20},
        {type: "client-credit", currency: "mxn", ammount: 85000},
        {type: "client-balance", currency: "mxn", ammount: 95000}        
      ];
      expect(InvoiceService.getPaymentMethodBasedOnPayments(payments))
        .to.equal('cash');
    });

  });

  describe("prepareClient", function(){
    it("should return an object with real data, when RFC is not generic", function(){

    });
  });

});
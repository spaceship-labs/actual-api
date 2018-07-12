const _ = require('underscore');

describe('Payment service', function(){

  describe("addPayment", function(){
    it("should throw an error when is a card payment and doesnt have a terminal associated", async function(){
      const req = {};
      const params = {type:'debit-card'};
      expect(PaymentService.addPayment(params, req))
        .to.eventually.be.rejectedWith('Es necesario asignar una terminal a este tipo de pago');
    });

    it("should throw an error when is a transfer payment and doesnt have a terminal associated", async function(){
      const req = {};
      const params = {type:'transfer'};
      expect(PaymentService.addPayment(params, req))
        .to.eventually.be.rejectedWith('Es necesario asignar una terminal a este tipo de pago');
    });
  });

  it('should detect if payment method is a card payment method', async function(){
    const payment = {type: 'credit-card'};
    expect(PaymentService.isCardPayment(payment)).to.equal(true);
  });

  it("should detect if payment method type is transfer or transfer usd", function(){
    const payment = {type: 'transfer-usd'};
    expect(PaymentService.isTransferPayment(payment)).to.equal(true);
  });

  it('should calculate payments total', async function(){
    const payments = [
      {type:'credit-card', currency: 'mxn', ammount: 200},
      {type:'cash-usd', currency: 'usd', ammount: 10}
    ];
    const exchangeRate = 18.50;
    const result = PaymentService.calculatePaymentsTotal(payments, exchangeRate);
    expect(result).to.equal(385);
  });

  it('should calculate payments total for payments group 1', async function(){
    const payments = [
      {type:'credit-card', currency: 'mxn', group:1, ammount: 300},
      {type:'cash-usd', currency: 'usd', group: 1, ammount: 10},
      {type:'3-msi', currency: 'mxn', group:2, ammount: 10}      
    ];
    const exchangeRate = 18.50;
    const result = PaymentService.calculatePaymentsTotalPg1(payments, exchangeRate);
    expect(result).to.equal(485);
  });

  it('should calculate correctly a usd payment', async function(){
    const payment = {ammount: 100};
    const  exchangeRate = 18.20;
    expect(PaymentService.calculateUSDPayment(payment, exchangeRate)).to.equal(1820);
  });

  it('should get a valid exchange rate', async function(){
    const result = await PaymentService.getExchangeRate();
    expect(result).to.be.a('number');
  });

  it('should return a boolean when checking if client has credit', async function(){
    const clientId = 'client.id';
    const result = await PaymentService.checkIfClientHasCreditById(clientId);
    expect(result).to.be.a('boolean');
  });

  it('should show only methods groups with group 1 for a client with special discount', async function(){
    const methodGroups = _.clone(sails.config.paymentGroups);
    const result = PaymentService.filterMethodsGroupsForDiscountClients(methodGroups);
    expect(result).to.be.an('array');
  });

  it('should retrieve methods groups', async function(){
    const paymentGroups = PaymentService.getPaymentGroups();
    expect(paymentGroups).to.be.an('array');
  });

  it('should add the credit method group to the method groups', async function(){
    const paymentGroups = PaymentService.getPaymentGroups();
    const result = PaymentService.addCreditMethod(paymentGroups);
    expect(result).to.be.an('array');
    const paymentGroup1 = paymentGroups[0];
    const creditMethod = _.findWhere(paymentGroup1.methods,{type:PaymentService.types.CLIENT_CREDIT});
    expect(creditMethod).to.be.an('object');
    expect(creditMethod.type).to.be.equal(PaymentService.types.CLIENT_CREDIT);
  });

  it('should add the single payment terminal method group to the method groups', async function(){
    const paymentGroups = PaymentService.getPaymentGroups();
    const result = PaymentService.addSinglePaymentTerminalMethod(paymentGroups);
    expect(result).to.be.an('array');
    const paymentGroup1 = paymentGroups[0];
    const singlePaymentMethod = _.findWhere(paymentGroup1.methods,{type:PaymentService.types.SINGLE_PAYMENT_TERMINAL});
    expect(singlePaymentMethod).to.be.an('object');
    expect(singlePaymentMethod.type).to.be.equal(PaymentService.types.SINGLE_PAYMENT_TERMINAL);
  });


  it('should remove the credit method group to the method groups', async function(){
    const paymentGroups = PaymentService.getPaymentGroups();
    const result = PaymentService.addCreditMethod(paymentGroups);

    expect(result).to.be.an('array');
    const resultAux = PaymentService.removeCreditMethod(result);

    expect(resultAux).to.be.an('array');
    const paymentGroup1 = resultAux[0];

    const creditMethod = _.findWhere(paymentGroup1.methods,{type:PaymentService.types.CLIENT_CREDIT});
    expect(creditMethod).to.be.undefined;
  });


  it('should add legacy methods  to method groups when calling addLegacyMethods', async function(){
    const paymentGroups = PaymentService.getPaymentGroups();
    const methodGroups = PaymentService.addLegacyMethods(paymentGroups);
    expect(methodGroups).to.be.an('array');

    const legacyMethodsTypes = PaymentService.LEGACY_METHODS_TYPES;
    var legacyMethodsCount = 0;
    legacyMethodsTypes.forEach(function(legacyMethodType){
      methodGroups.forEach(function(group){
        var hasLegacyMethod = _.some(group.methods, function(method){
          return method.type === legacyMethodType;
        });
        if(hasLegacyMethod) legacyMethodsCount++;
      });
    });
    expect(legacyMethodsTypes.length).to.be.equal(legacyMethodsCount);

  });

  describe('isCanceled', function(){
    it('should return true if payment is canceled', function() {
      var payment = { status: 'canceled' };
      expect(PaymentService.isCanceled(payment)).to.be.equal(true);
    });

    it('should return false if payment is not canceled', function() {
      var payment = { status: 'processed' };
      expect(PaymentService.isCanceled(payment)).to.be.equal(false);
    });
  });

  describe('mapStatusType', function(){
    it('should return the correct label for canceled status type', function(){
      const payment = {status: 'canceled'};
      expect(PaymentService.mapStatusType(payment.status)).to.be.equal('Cancelado');
    });

    it('should return the same status as label when it is not recognized', function(){
      const payment = {status: 'not.recognized'};
      expect(PaymentService.mapStatusType(payment.status)).to.be.equal('not.recognized');
    });
  });

});
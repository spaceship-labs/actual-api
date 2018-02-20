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
      const order = {
        id: "order.id",
        folio: "000001",
        CardName: "card.name",
        U_Estado: "QR"
      };
      const client = {
        LicTradNum: 'ADC180325',
        cfdiUse: 'G01'
      };
      const address = {
        companyName: 'Company.test',
        U_Correos: 'test@example.com',
        Street: 'street.1',
        U_NumExt: '12',
        U_NumInt: '21',
        Block: '34',
        State: 'QR',
        U_Localidad: 'Benito juarez',
        City: 'Cancun',
        ZipCode: '77500'
      };

      const expected = {
        name: address.companyName,
        identification: (client.LicTradNum || "").toUpperCase(),
        email: address.U_Correos,
        cfdiUse: client.cfdiUse,
        address: {
          street: address.Street,
          exteriorNumber: address.U_NumExt,
          interiorNumber: address.U_NumInt,
          colony: address.Block,
          country: 'México',
          state: address.State,
          municipality:  address.U_Localidad,
          localitiy: address.City,
          zipCode: address.ZipCode,
        }  
      };

      const result = InvoiceService.prepareClientParams(order, client, address);
      expect(result)
        .to.deep.equal(expected);
    });

    it("should return an object with real data, when RFC is generic", function(){
      const order = {
        id: "order.id",
        folio: "000001",
        CardName: "card.name",
        U_Estado: "QR"
      };
      const client = {
        LicTradNum: InvoiceService.RFCPUBLIC,
        cfdiUse: 'G01'
      };
      const address = {
        companyName: 'Company.test',
        U_Correos: 'test@example.com',
        Street: 'street.1',
        U_NumExt: '12',
        U_NumInt: '21',
        Block: '34',
        State: 'QR',
        U_Localidad: 'Benito juarez',
        City: 'Cancun',
        ZipCode: '77500'
      };

      const expected = {
        name: order.CardName,
        identification: InvoiceService.RFCPUBLIC,
        cfdiUse: InvoiceService.DEFAULT_CFDI_USE,
        address: {
          country: 'México',
          state: order.U_Estado
        }          
      };

      const result = InvoiceService.prepareClientParams(order, client, address);
      expect(result)
        .to.deep.equal(expected);
    });

  });

  describe("getUnitTypeByProduct", function(){
    it("should return service type when product is service", function(){
      const product = {Service: "Y"};
      expect(InvoiceService.getUnitTypeByProduct(product))
        .to.be.equal('service');
    });

    it("should return service type when product unit clave is E48", function(){
      const product = {U_ClaveUnidad: "E48"};
      expect(InvoiceService.getUnitTypeByProduct(product))
        .to.be.equal("service");
    });

    it("should return piece type when product unit clave is H87", function(){
      const product = {U_ClaveUnidad: "H87"};
      expect(InvoiceService.getUnitTypeByProduct(product))
        .to.be.equal("piece");
    });

    it("should return piece type when product unit clave is missing", function(){
      const product = {};
      expect(InvoiceService.getUnitTypeByProduct(product))
        .to.be.equal("piece");
    });

  });

});
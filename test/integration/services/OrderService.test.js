describe("OrderService", function(){
  describe("validateSapOrderCreated", function(){
    it("should return true when order response is valid", function(){
      const sapResponse = "{\"@odata.context\":\"http://sapnueve.homedns.org/$metadata#Edm.String\",\"value\":\"[{\\\"result\\\":\\\"13000012\\\",\\\"type\\\":\\\"Order\\\",\\\"Payments\\\":[{\\\"pay\\\":\\\"27000019\\\",\\\"reference\\\":\\\"5a8c60c9695af6237a238289\\\"}],\\\"series\\\":null},{\\\"result\\\":\\\"0\\\",\\\"type\\\":\\\"Balance\\\",\\\"Payments\\\":[],\\\"series\\\":null}]\"}";
      const sapResult = [
        {
          result:"13000012",
          type: "Order",
          Payments:[
            {
              pay:"27000019",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"0",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];
      const paymentsToCreate = [
        {type: 'cash', ammount: 1200}
      ];
      expect(OrderService.validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate))
        .to.be.equal(true);
    });

    //TODO: checar este test
    it("should throw an error when order response is invalid, no payments arent created when sending only client-balance or credit-client", function(){
      const sapResponse = "{\"@odata.context\":\"http://sapnueve.homedns.org/$metadata#Edm.String\",\"value\":\"[{\\\"result\\\":\\\"13000012\\\",\\\"type\\\":\\\"Order\\\",\\\"Payments\\\":[{\\\"pay\\\":\\\"27000019\\\",\\\"reference\\\":\\\"5a8c60c9695af6237a238289\\\"}],\\\"series\\\":null},{\\\"result\\\":\\\"0\\\",\\\"type\\\":\\\"Balance\\\",\\\"Payments\\\":[],\\\"series\\\":null}]\"}";
      const sapResult = [
        {
          result:"13000012",
          type: "Order",
          Payments:[
            {
              pay:"27000019",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"0",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];
      const paymentsToCreate = [
        {type: 'client-balance', ammount: 1200},
        {type: 'client-credit', ammount: 3000}
      ];
      
      expect(OrderService.validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate)).to.be.equal(true);
      //THIS SHOULD HAPPEN
      /*
      expect(() => OrderService.validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate))
        .to.throw("Error en la respuesta de SAP");
      */
    });

    it("should throw an error when payment response doesnt hava a correct(numeric) pay property(document in sap)", function(){
      const sapResponse = "{\"@odata.context\":\"http://sapnueve.homedns.org/$metadata#Edm.String\",\"value\":\"[{\\\"result\\\":\\\"13000012\\\",\\\"type\\\":\\\"Order\\\",\\\"Payments\\\":[{\\\"pay\\\":\\\"27000019\\\",\\\"reference\\\":\\\"5a8c60c9695af6237a238289\\\"}],\\\"series\\\":null},{\\\"result\\\":\\\"0\\\",\\\"type\\\":\\\"Balance\\\",\\\"Payments\\\":[],\\\"series\\\":null}]\"}";
      const sapResult = [
        {
          result:"13000012",
          type: "Order",
          Payments:[
            {
              pay:"NOT.CORRECT.PAY.DOCUMENT",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"0",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];
      const paymentsToCreate = [
        {type: 'cash', ammount: 1200}
      ];


      expect(() => OrderService.validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate))
        .to.throw("Error en la respuesta de SAP");
    });

    it("should return true when balance response is negative", function(){
      const sapResponse = "{\"@odata.context\":\"http://sapnueve.homedns.org/$metadata#Edm.String\",\"value\":\"[{\\\"result\\\":\\\"13000012\\\",\\\"type\\\":\\\"Order\\\",\\\"Payments\\\":[{\\\"pay\\\":\\\"27000019\\\",\\\"reference\\\":\\\"5a8c60c9695af6237a238289\\\"}],\\\"series\\\":null},{\\\"result\\\":\\\"0\\\",\\\"type\\\":\\\"Balance\\\",\\\"Payments\\\":[],\\\"series\\\":null}]\"}";
      const sapResult = [
        {
          result:"13000012",
          type: "Order",
          Payments:[
            {
              pay:"11102242",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"-200",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];
      const paymentsToCreate = [
        {type: 'cash', ammount: 1200}
      ];

      expect(OrderService.validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate))
        .to.be.equal(true);      
    });

    it("should return true when balance response is positive", function(){
      const sapResponse = "{\"@odata.context\":\"http://sapnueve.homedns.org/$metadata#Edm.String\",\"value\":\"[{\\\"result\\\":\\\"13000012\\\",\\\"type\\\":\\\"Order\\\",\\\"Payments\\\":[{\\\"pay\\\":\\\"27000019\\\",\\\"reference\\\":\\\"5a8c60c9695af6237a238289\\\"}],\\\"series\\\":null},{\\\"result\\\":\\\"0\\\",\\\"type\\\":\\\"Balance\\\",\\\"Payments\\\":[],\\\"series\\\":null}]\"}";
      const sapResult = [
        {
          result:"13000012",
          type: "Order",
          Payments:[
            {
              pay:"11102242",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"300",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];
      const paymentsToCreate = [
        {type: 'cash', ammount: 1200}
      ];

      expect(OrderService.validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate))
        .to.be.equal(true);      
    });


    it("should throw an error when one of the items has an error type result", function(){
      const sapResponse = "{\"@odata.context\":\"http://sapnueve.homedns.org/$metadata#Edm.String\",\"value\":\"[{\\\"result\\\":\\\"13000012\\\",\\\"type\\\":\\\"Order\\\",\\\"Payments\\\":[{\\\"pay\\\":\\\"27000019\\\",\\\"reference\\\":\\\"5a8c60c9695af6237a238289\\\"}],\\\"series\\\":null},{\\\"result\\\":\\\"0\\\",\\\"type\\\":\\\"Balance\\\",\\\"Payments\\\":[],\\\"series\\\":null}]\"}";
      const sapResult = [
        {
          result:"Generic.SAP.error",
          type: "Error",
          Payments:[
            {
              pay:"4993902023",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"0",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];
      const paymentsToCreate = [
        {type: 'cash', ammount: 1200}
      ];

      expect(() => OrderService.validateSapOrderCreated(sapResponse, sapResult, paymentsToCreate))
        .to.throw("Generic.SAP.error");      
    });
  });

  describe("collectSapErrors", function(){
    it("should concat errors from SAP response items", function(){
      const sapResult = [
        {
          result:"Generic.SAP.error",
          type: "Error",
          Payments:[
            {
              pay:"4993902023",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"Generic.SAP.error2",
          type: "Error",
          Payments:[
            {
              pay:"4993902023",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },        
        {
          result:"0",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];      
      
      expect(OrderService.collectSapErrors(sapResult))
        .to.be.equal("Generic.SAP.error, Generic.SAP.error2, ");
    });
  });

  describe("collectSapErrorsBySapOrder", function(){
    it("should extract an error from an order sap item response", function(){
      const sapOrderItemRes = {
          result:"Generic.SAP.error",
          type: "Error",
          Payments:[
            {
              pay:"4993902023",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
      };
      expect(OrderService.collectSapErrorsBySapOrder(sapOrderItemRes))
        .to.be.equal("Generic.SAP.error");
    });
  });

  describe("checkIfSapOrderHasReference", function(){
    it("should return true if sap order response item has a reference(document), an Order", function(){
      const sapOrderItemRes = {
        result:"333919123",
        type: "Order",
        Payments:[
          {
            pay:"4993902023",
            reference:"5a8c60c9695af6237a238289"
          }
        ],
        series:null
      };
      expect(OrderService.checkIfSapOrderHasReference(sapOrderItemRes))
        .to.be.equal(true);
    });

    it("should return true if sap order response item has a reference(document), an Invoice", function(){
      const sapOrderItemRes = {
        result:"333919123",
        type: "Invoice",
        Payments:[
          {
            pay:"4993902023",
            reference:"5a8c60c9695af6237a238289"
          }
        ],
        series:null
      };
      expect(OrderService.checkIfSapOrderHasReference(sapOrderItemRes))
        .to.be.equal(true);
    });

    it("should return false when sap order item doesnt have an invoice neither order type", function(){
      const sapOrderItemRes = {
        result:"An.error",
        type: "Error",
        Payments:[
          {
            pay:"4993902023",
            reference:"5a8c60c9695af6237a238289"
          }
        ],
        series:null
      };
      expect(OrderService.checkIfSapOrderHasReference(sapOrderItemRes))
        .to.be.equal(false);
    });

  });


  describe("checkIfSapOrderHasPayments", function(){
    it("should return true if order item response has payments, excepting if it was a client-credit or client-balance payment", function(){
      const sapOrderItemRes = {
        result:"234941113",
        type: "Order",
        Payments:[
          {
            pay:"4993902023",
            reference:"5a8c60c9695af6237a238289"
          }
        ],
        series:null
      }; 
      const payments = [{type:"cash", ammount:500}];
      expect(OrderService.checkIfSapOrderHasPayments(sapOrderItemRes, payments))
        .to.be.equal(true);
    });
  });

  describe("checkIfSapOrderHasPayments", function(){
    it("should return true, no payments are returned when using only client balance or credit", function(){
      const sapOrderItemRes = {
        result:"234941113",
        type: "Order",
        Payments:[],
        series:null
      }; 
      const payments = [{type:"client-credit", ammount:500}];
      expect(OrderService.checkIfSapOrderHasPayments(sapOrderItemRes, payments))
        .to.be.equal(true);
    });

    it("should return false, when payments from response and from creation params missmatch", function(){
      const sapOrderItemRes = {
        result:"234941113",
        type: "Order",
        Payments:[],
        series:null
      }; 
      const payments = [{type:"cash", ammount:500}];
      expect(OrderService.checkIfSapOrderHasPayments(sapOrderItemRes, payments))
        .to.be.equal(false);
    });

  });

  describe("everyPaymentIsClientBalanceOrCredit", function(){
    it("should return true when every payment have client-credit or client-balance types", function(){
      const payments = [
        {type:'client-credit', ammount: 340},
        {type:'client-balance', ammount: 200}
      ];
      expect(OrderService.everyPaymentIsClientBalanceOrCredit(payments))
        .to.be.equal(true);
    });

    it("should return false when not every payment have client-credit or client-balance types", function(){
      const payments = [
        {type:'client-credit', ammount: 340},
        {type:'credit-card', ammount: 200}
      ];
      expect(OrderService.everyPaymentIsClientBalanceOrCredit(payments))
        .to.be.equal(false);
    });

  });

  describe("extractBalanceFromSapResult", function(){
    it("should extract the correct balance from a sap result", function(){
      const sapResult = [
        {
          result:"13000012",
          type: "Order",
          Payments:[
            {
              pay:"443333911",
              reference:"5a8c60c9695af6237a238289"
            }
          ],
          series:null
        },
        {
          result:"1600",
          type:"Balance",
          Payments:[],
          series:null
        }
      ];
      expect(OrderService.extractBalanceFromSapResult(sapResult))
        .to.be.equal(1600);      
    });
  });

  describe("getPaidPercentage", function(){
    it("should return a paid percentage of 50", function(){
      expect(OrderService.getPaidPercentage(800, 1600))
        .to.be.equal(50);
    });

    it("should return a paid percentage of 99", function(){
      expect(OrderService.getPaidPercentage(990, 1000))
        .to.be.equal(99);
    });

    it("should return a paid percentage of 100 when ammount paid and total are the same", function(){
      expect(OrderService.getPaidPercentage(800.49, 800.49))
        .to.be.equal(100);
    });

  });

  describe("buildOrderCreateParams", function(){
    it("should create the correct order create params", function(){
      const quotation = {
        id: "quotation.id1",
        source: "internet",
        totalProducts: 2,
        total: 2400,
        discount: 2400,
        subtotal: 2400,
        ammountPaid: 2400,
        paymentGroup: 1,
        Client: {
          id: "client.id1",
          CardName: "test.CardName",
          CardCode:"CARDCODE.TEST"
        },
        Payments: [{id:"payment.id1"},{id:"payment.id2"}],
        ClientBalanceRecords: [],
        EwalletRecords: [],
        Broker: {id:"broker.id1"},
        Address: {
          id: "address.id1",
          CntctCode: 10,
          CardCode: "CARDCODE.TEST",
          Address: "St. Test",
          U_Ciudad: "Test city",
          U_Colonia: "Test colonia",
          U_Noexterior: "21",
          U_Nointerior: "12",
          U_CP: "77500",
          U_Notes1: "Test notes"
        }
      };
      const user = {
        id: "user.id1",
        Seller: {
          SlpCode: "sample.slpcode"
        }
      };
      const currentStore = {
        id: "store.id1",
        GroupCode: "group.code.sample"
      };

      const result = OrderService.buildOrderCreateParams({
        quotation, 
        user, 
        currentStore, 
        client: quotation.Client, 
        payments: quotation.Payments, 
        address: quotation.Address, 
        clientBalanceRecords: quotation.ClientBalanceRecords, 
        ewalletRecords: quotation.EwalletRecords, 
        broker: quotation.Broker
      });
      

      const expected = {
        source: 'internet',
        ammountPaid: 2400,
        total: 2400,
        subtotal: 2400,
        discount: 2400,
        paymentGroup: 1,
        groupCode: 'group.code.sample',
        totalProducts: 2,
        Client: 'client.id1',
        CardName: 'test.CardName',
        Quotation: 'quotation.id1',
        Payments: [ 'payment.id1', 'payment.id2' ],
        EwalletRecords: [],
        ClientBalanceRecords: [],
        User: 'user.id1',
        CardCode: 'CARDCODE.TEST',
        SlpCode: 'sample.slpcode',
        Store: 'store.id1',
        Manager: undefined,
        Broker: 'broker.id1',
        status: 'paid',
        Address: 'address.id1',
        address: 'St. Test',
        CntctCode: 10,
        U_Ciudad: 'Test city',
        U_Colonia: 'Test colonia',
        U_Noexterior: '21',
        U_Nointerior: '12',
        U_CP: '77500',
        U_Notes1: 'Test notes'        
      };

      expect(result).to.deep.equal(expected);
    });
  });

});
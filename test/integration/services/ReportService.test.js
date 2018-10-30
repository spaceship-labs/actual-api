const _ = require('underscore');

describe("ReportService", function(){

  describe("getMultipleStoresTotal", function(){
    it("should get the correct total acum of stores totals", function(){
      const stores = [
        {id: "store.id.1", total: 200}, 
        {id: "store.id.2", total: 250},
        {id: "store.id.3", total: 350},        
      ];
      expect(ReportService.getMultipleStoresTotal(stores)).to.be.equal(800);
    });
  });

  describe("getStoreTotal", function(){
    it("should get the correct store total, reading sellers total", function(){
      const store = {
        id: "store.id1",
        sellers: [
          {id:"seller.id1", total: 120},
          {id:"seller.id1", total: 260},
        ]
      };
      expect(ReportService.getStoreTotal(store)).to.be.equal(380);
    });

    it("should get the correct store total, reading divisions total", function(){
      const store = {
        id: "store.id1",
        divisions: [
          {total: 710, subdivisions: [
            {total: 200, payments: [{id:"payment.id1", ammount: 120}, {id:"payment.id2", ammount: 80}]},
            {total: 510, payments: [{id:"payment.id3", ammount: 210}, {id:"payment.id4", ammount: 300}]},
          ]},
          {total: 590, subdivisions: [
            {total: 140, payments: [{id:"payment.id5", ammount: 60}, {id:"payment.id6", ammount: 80}]},
            {total: 450, payments: [{id:"payment.id7", ammount: 150}, {id:"payment.id8", ammount: 300}]},
          ]}
          
        ]
      };
      expect(ReportService.getStoreTotal(store, {readDivisions: true})).to.be.equal(1300);
    });

  });

  describe("getSubdivisionTotal", function(){
    it("should get the correct subdivision total, defaults to MXN amount, and excluding canceled payments", function(){
      const subdivision = {
        payments: [
          {id: "payment.id.1", ammount: 400, currency: 'mxn'},
          {id: "payment.id.2", ammount: 220, currency: 'mxn'},
          {id: "payment.id.3", ammount: 800, currency: 'mxn', status: 'canceled'},          
          {id: "payment.id.4", ammount: 1200, currency: 'mxn'},          
        ]
      };
      expect(ReportService.getSubdivisionTotal(subdivision)).to.be.equal(1820);
    });

    it("should get the correct subdivision total, defaults to MXN total amount, even with usd payments", function(){
      const subdivision = {
        payments: [
          {id: "payment.id.1", ammount: 400, currency: 'usd', exchangeRate: 18.50},
          {id: "payment.id.2", ammount: 220, currency: 'usd', exchangeRate: 18.50},
          {id: "payment.id.3", ammount: 800, currency: 'usd', status: 'canceled'},          
          {id: "payment.id.4", ammount: 1200, currency: 'usd', exchangeRate: 18.50},          
        ]
      };
      expect(ReportService.getSubdivisionTotal(subdivision)).to.be.equal(33670);
    });

    it("should get the correct subdivision total, forcing total in USD currency", function(){
      const subdivision = {
        payments: [
          {id: "payment.id.1", ammount: 400, currency: 'usd', exchangeRate: 18.50},
          {id: "payment.id.2", ammount: 220, currency: 'usd', exchangeRate: 18.50},
          {id: "payment.id.3", ammount: 800, currency: 'usd', status: 'canceled'},          
          {id: "payment.id.4", ammount: 1200, currency: 'usd', exchangeRate: 18.50},          
        ]
      };
      expect(ReportService.getSubdivisionTotal(subdivision, {currency: 'usd'})).to.be.equal(1820);
    });


  });

  /*
  describe("buildPaymentsDivisions", function(){
    it("should do something", function(){
      var PaymentService = require('../../../api/services/PaymentService');
      var paymentGroups = PaymentService.getPaymentGroups({
        readLegacyMethods: true,
        readCreditMethod: true
      });

      const payments = [
        {id:"payment.id.1", type:"cash", ammount: 200}
      ];

      var expected = paymentGroups.reduce(function(acum, group){
        var division = {};
        if(group.group == 1){
          division.name = "Un solo pago";
          division.subdivisions = group.methods.filter(function(method){
            return !method.terminals;
          }).map(function(method){
            method.Payments = _.where(payments, {type: method.type});
            return method;
          });
        }
        return acum;
      }, []);
    
      var result = ReportService.buildPaymentDivisions(payments);
      expect(result).to.deep.equal(expected);
    });
  });
  */
});
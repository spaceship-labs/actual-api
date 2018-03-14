const _ = require('underscore');

describe("ReportService", function(){
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
});
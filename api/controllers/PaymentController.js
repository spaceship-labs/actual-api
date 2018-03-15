module.exports = {

  async add(req, res){
    const form = req.allParams();
    try{
      const createdPayment = await PaymentService.addPayment(form, req);
      const calculator = QuotationService.Calculator();
      const quotationId = createdPayment.Quotation;
      
      var opts = {
        paymentGroup: 1,
        updateDetails: true,
        currentStoreId: req.user.activeStore.id
      };
      
      await calculator.updateQuotationTotals(quotationId, opts);
      return res.json(createdPayment);
    }
    catch(err){
      console.log('err payment add', err);
      res.negotiate(err);
    }
  },

  async cancel(req, res){
    const {id} = req.allParams();
    try{
      const canceledPayment = await PaymentService.quotationPaymentCancel(id);
      const calculator = QuotationService.Calculator();
      const quotationId = canceledPayment.Quotation;
      
      var opts = {
        paymentGroup: 1,
        updateDetails: true,
        currentStoreId: req.user.activeStore.id
      };        
      
      await calculator.updateQuotationTotals(quotationId, opts);
      return res.json(canceledPayment); 
           
    }catch(err){
      console.log('err cancel', err);
      res.negotiate(err);
    }
  },

  getPaymentGroups: function(req, res){
    var form = req.allParams();
    var paymentGroups = PaymentService.getPaymentGroups(form);
    res.json(paymentGroups);
  }	
};

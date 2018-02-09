module.exports = {

  async add(req, res){
    const form  = req.allParams();
    try{
      const quotation = await PaymentService.addPayment(form, req);
      return res.json(quotation);
    }catch(err){
      console.log('err payment add', err);
      res.negotiate(err);
    }
  },

  cancel: function(req, res){
    res.negotiate(new Error('Cancelaciones no disponibles'));  
  },

  getPaymentGroups: function(req, res){
    var form = req.allParams();
    var paymentGroups = PaymentService.getPaymentGroups(form);
    res.json(paymentGroups);
  }	
};

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
      const canceledPayment = await PaymentService.cancel(id);
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
  },
  SAPConciliation: async function(req,res){
    const { page, startingDate, endingDate, getAll } = req.allParams()
    var dateStart, dateEnd;
    // validations
    if (startingDate){
      dateStart = new Date(startingDate).toISOString()
    } else {
      dateStart = "2019-02-01T00:00:00-05:00"
    }
    if (endingDate){
      dateEnd = new Date(endingDate).toISOString()
    } else {
      dateEnd = "2019-06-01T00:00:00-05:00"
    }
    console.log(dateStart,dateEnd)
    // retrieve for exportation
    let value=[];
    if(getAll){
      let i=1;
      let isRetrieving=true;
      while(isRetrieving){
        const { value: SapValue } = await SapService.paymentReport(i, dateStart, dateEnd);
        if(SapValue.length == 0){
          isRetrieving = false
        } else {
          value = value.concat(SapValue) // append all
        }
        i++;
      }
    } else {
      // retrieve for single page
      const { value: SapValue } = await SapService.paymentReport(page, dateStart, dateEnd);
      value = SapValue
    }
    // collation

    Promise.all(value.map( async paymentSap => {
      try {
        const payment = await Payment.findOne({ id: paymentSap.U_MongoId });
        if (!payment) {
          let dummyData = {
            ammount: 0,
            ammountUSD: 0,
            ammountMXN: 0,
            folio: "Not found",
            CardCode:"Not found",
            CardName:"Not found",
            Store:"Not found",
            Seller:"Not found",
            diff: -paymentSap.DocTotal
          }
          return {
            ...paymentSap,
            ...dummyData
          }
        }
        const quotation = await Quotation.findOne({ id: payment.Quotation }).populate('User').populate('Store').populate('Client');
        if (quotation) {
          payment.Store = quotation.Store.name;
          payment.User = quotation.User.name;
          if (quotation.Client && quotation.Client.CardCode) {
            const { CardCode } = quotation.Client;
            payment.CardCode= CardCode;
          } 
          if (quotation.Client && quotation.Client.CardName) {
            const { CardName } = quotation.Client;
            payment.CardName= CardName;
          }
        }
        if (payment.currency!='mxn') {
          payment.ammountUSD = payment.ammount;
          payment.ammountMXN = payment.ammount * payment.exchangeRate;
        } else {
          payment.ammountUSD = payment.ammount/payment.exchangeRate;
          payment.ammountMXN = payment.ammount;
        }

        return {
          ...paymentSap,
          ...payment,
          diff: payment.ammountMXN - paymentSap.DocTotal
        }
      } catch (ex) {
        console.log(ex);
      }
    })).then( data => { 
      res.json({ data, total:180 })
    })
  }
};

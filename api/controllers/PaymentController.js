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
      dateStart = "2020-02-01T00:00:00-05:00"
    }
    if (endingDate){
      dateEnd = new Date(endingDate).toISOString()
    } else {
      dateEnd = "2020-02-28T00:00:00-05:00"
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
    const Ids = value.map( payment => payment.U_MongoId )
    const payments = await Payment.find({ id: Ids })
    const AllStores = await Store.find();

    Promise.all(payments.map( async payment => {
      try{
        // get corresponding sap value
        const sapValue = value.find(value => value.U_MongoId == payment.id )
        // get store
        const { name: Store } = AllStores.find(value => value.id == payment.Store);
        const sellers = await User.find({id:payment.User})
        const {firstName, lastName} = sellers[0]
        const clients = await Client.find({id:payment.Client})
        
        if(clients[0] && clients[0].CardCode){
          const { CardCode } = clients[0]
          payment.CardCode = CardCode;
        }
        if(clients[0] && clients[0].CardName){
          const { CardName } = clients[0]
          payment.CardName = CardName;
        }
        payment.Store = Store;
        payment.User = `${firstName} ${lastName}`;
        // formatting payment
        if(payment.currency!='mxn'){
          payment.ammountUSD = payment.ammount;
          payment.ammountMXN = payment.ammount * payment.exchangeRate;
        }else {
          payment.ammountUSD = payment.ammount/payment.exchangeRate;
          payment.ammountMXN = payment.ammount;
        }
        return {
          ...payment,
          ...sapValue,
          diff: payment.ammountMXN - sapValue.DocTotal
        }
      } catch (ex){
        console.log(ex)
      }
    })
    ).then(data => { 
      res.json({data, total:180})
    })
  }
};

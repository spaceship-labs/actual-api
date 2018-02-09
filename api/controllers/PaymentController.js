var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
var EWALLET_TYPE = 'ewallet';
var CLIENT_BALANCE_TYPE = 'client-balance';
var CLIENT_CREDIT_TYPE = 'client-credit';
var EWALLET_NEGATIVE = 'negative';
var CANCELED_STATUS = 'canceled';
var PAYMENT_CANCEL_TYPE = 'cancelation';

module.exports = {

  add: function(req, res){
    var form          = req.params.all();
    var quotationId   = form.quotationid;
    var paymentGroup  = form.group || 1;
    var client        = false;
    var quotationPayments = [];
    var exchangeRate;
    var quotation;
    var quotationUpdateParams;
    var ACTUAL_HOME_XCARET_CODE = 'actual_home_xcaret';
    var ACTUAL_STUDIO_CUMBRES_CODE = 'actual_studio_cumbres';
    var ACTUAL_STUDIO_MALECON_CODE = 'actual_studio_malecon';
    var ACTUAL_STUDIO_PLAYA_CODE = 'actual_studio_playa_del_carmen';
    var ACTUAL_STUDIO_MERIDA_CODE = 'actual_studio_merida';    
    var ACTUAL_PUERTO_CANCUN_CODE = 'actual_puerto_cancun';    

    var PROJECTS_CODE = 'actual_proyect';
    
    var storeCode = req.user.activeStore.code;
    var quotationTotal;
    var previousPayments;

    form.Quotation    = quotationId;
    form.Store = req.user.activeStore.id;
    form.User = req.user.id;    

    if (form.Details) {
      form.Details = formatProductsIds(form.Details);
    }

    if(
      storeCode !== ACTUAL_HOME_XCARET_CODE &&
      storeCode !== ACTUAL_STUDIO_CUMBRES_CODE &&
      storeCode !== ACTUAL_STUDIO_MALECON_CODE && 
      storeCode !== ACTUAL_STUDIO_PLAYA_CODE && 
      storeCode !== ACTUAL_STUDIO_MERIDA_CODE && 
      storeCode !== ACTUAL_PUERTO_CANCUN_CODE && 
      storeCode !== PROJECTS_CODE && 
      process.env.MODE === 'production'
    ){
      res.negotiate(new Error("La creación de pedidos para esta tienda esta deshabilitada"));
      return;
    }

    StockService.validateQuotationStockById(quotationId, req.user.activeStore)
      .then(function(isValidStock){

        if(!isValidStock){
          return Promise.reject(new Error('Inventario no suficiente'));
        }

        var findQuotation = Quotation.findOne(form.Quotation).populate('Payments');

        if(form.type === EWALLET_TYPE || form.type === CLIENT_BALANCE_TYPE){
          findQuotation.populate('Client');
        }

        return findQuotation;
      })
      .then(function(quotationFound){
        quotation = quotationFound;
        client = quotation.Client;
        form.Client = client.id || client;
        previousPayments = quotation.Payments;
        var fundsValidationPromise = Promise.resolve();

        if(form.type === EWALLET_TYPE){
          fundsValidationPromise = EwalletService.isValidEwalletPayment(form, form.Client);
        }

        if(form.type === CLIENT_BALANCE_TYPE){
          fundsValidationPromise = ClientBalanceService.isValidClientBalancePayment(form, form.Client);
        }

        return fundsValidationPromise;
      })
      .then(function(hasEnoughFunds){

        if(form.type === EWALLET_TYPE && !hasEnoughFunds){
          return Promise.reject(new Error('Fondos insuficientes en monedero electronico'));
        }

        if(form.type === CLIENT_BALANCE_TYPE && !hasEnoughFunds){
          return Promise.reject(new Error('Fondos insuficientes en balance de cliente'));
        }

        var calculator = QuotationService.Calculator();
        var calculatorParams = {
          currentStoreId: req.user.activeStore.id,
          paymentGroup: paymentGroup,
          update: false,
          financingTotals: true
        };

        var auxPromises = [
          PaymentService.getExchangeRate(),
          calculator.getQuotationTotals(form.Quotation ,calculatorParams),
        ];

        if(typeof form.Client === 'string' && form.type === CLIENT_CREDIT_TYPE){
          auxPromises.push(PaymentService.checkIfClientHasCreditById(form.Client));
        }

        return auxPromises;
      })
      .spread(function(exchangeRateFound, quotationTotals){
        exchangeRate = exchangeRateFound;
        quotationTotal = quotationTotals.total;

        return PaymentService.calculatePaymentsTotal(previousPayments, exchangeRate);
      })
      .then(function(previousAmountPaid){
        var newPaymentAmount;
        var quotationRemainingAmount = quotationTotal - previousAmountPaid;
        var ROUNDING_AMOUNT = 1;

        quotationRemainingAmount += ROUNDING_AMOUNT;

        if(form.currency === PaymentService.CURRENCY_USD){
          newPaymentAmount = PaymentService.calculateUSDPayment(form, exchangeRate);
        }else{
          newPaymentAmount = form.ammount;
        }

        if(newPaymentAmount > quotationRemainingAmount){
          return Promise.reject(new Error('No es posible pagar mas del 100% del pedido'));
        }

        return Payment.create(form);
      })
      .then(function(paymentCreated){
        quotationPayments = quotation.Payments.concat([paymentCreated]);

        var promises = [
          PaymentService.calculatePaymentsTotal(quotationPayments, exchangeRate),
          PaymentService.calculatePaymentsTotalG1(quotationPayments, exchangeRate),
        ];

        if(form.type === EWALLET_TYPE){
          promises.push(
            EwalletService.applyEwalletRecord(form,{
              quotationId: quotationId,
              userId: req.user.id,
              client: client,
              paymentId: paymentCreated.id
            })
          );
        }

        if(form.type === CLIENT_BALANCE_TYPE){
          promises.push(
            ClientBalanceService.applyClientBalanceRecord(form,{
              quotationId: quotationId,
              userId: req.user.id,
              client: client,
              paymentId: paymentCreated.id              
            })
          );
        }        

        return promises;
      })
      .spread(function(ammountPaid, ammountPaidPg1){
        quotationUpdateParams = {
          ammountPaid: ammountPaid,
          ammountPaidPg1: ammountPaidPg1,
          paymentGroup: paymentGroup
        };
        return QuotationService.nativeQuotationUpdate(quotationId, quotationUpdateParams);
        //return Quotation.update({id:quotationId}, params);
      })
      .then(function(resultUpdate){
        delete quotation.Payments;
        quotation.ammountPaid = quotationUpdateParams.ammountPaid;
        quotation.paymentGroup = quotationUpdateParams.paymentGroup;

        res.json(quotation);

        //var updatedQuotation = resultUpdate[0];
        //res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  cancel: function(req, res){
    var form = req.allParams();
    var paymentId = form.paymentId;
    var quotationId = form.quotationId;
    var negativePayment; 
    res.negotiate(new Error('Cancelaciones no disponibles'));  
  },

  getPaymentGroups: function(req, res){
    var form = req.allParams();
    var paymentGroups = PaymentService.getPaymentGroups(form);
    res.json(paymentGroups);
  }	
};


function formatProductsIds(details){
  var result = [];
  if(details && details.length > 0){
    result = details.map(function(d){
      if(d.Product){
        d.Product = (typeof d.Product == 'string') ? d.Product :  d.Product.id;
      }
      return d;
    });
  }
  return result;
}
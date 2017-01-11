var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
var EWALLET_TYPE = 'ewallet';
var EWALLET_NEGATIVE = 'negative';
var CANCELLED_STATUS = 'cancelled';
var PAYMENT_CANCEL_TYPE = 'cancellation';

module.exports = {

  add: function(req, res){
    var form          = req.params.all();
    var quotationId   = form.quotationid;
    var totalDiscount = form.totalDiscount || 0;
    var paymentGroup  = form.group || 1;
    var client        = false;
    form.Quotation    = quotationId;
    if (form.Details) {
      form.Details = formatProductsIds(form.Details);
    }

    StockService.validateQuotationStockById(quotationId, req.user.id)
      .then(function(isValidStock){
        if(!isValidStock){
          return Promise.reject(new Error('Inventario no suficiente'));
        }else{
        	sails.log.info('Inventario valido');
        }
	    	return User.findOne({select:['activeStore'], id: req.user.id});
	    })
      .then(function(user){
        form.Store = user.activeStore;
        form.User = user.id;
        return Quotation.findOne(form.Quotation).populate('Client');
      })
      .then(function(quotation){
        client = quotation.Client;
        if (form.type != EWALLET_TYPE) { return; }
        if (client.ewallet < form.ammount || !client.ewallet) {
          return Promise.reject('Fondos insuficientes');
        }
        form.Client = client.id;
        return Client.update(client.id, {ewallet: client.ewallet - form.ammount});
      })
      .then(function(client){
        if(form.type == EWALLET_TYPE){
          var ewalletRecord = {
            Store: form.Store,
            Quotation: quotationId,
            User: req.userId,
            Client: client.id,
            type: EWALLET_NEGATIVE,
            amount: form.ammount
          };
          return EwalletRecord.create(ewalletRecord);
        }
        return null;
      })
      .then(function(result) {
        return Payment.create(form);
      })
      .then(function(paymentCreated){
        return calculateQuotationAmountPaid(quotationId);
      })
      .then(function(ammountPaid){
        var params = {
          ammountPaid: ammountPaid,
          paymentGroup: paymentGroup
        };
        return Quotation.update({id:quotationId}, params);
      })
      .then(function(updatedQuotation){
        if(updatedQuotation && updatedQuotation.length > 0){
          res.json(updatedQuotation[0]);
        }else{
          res.json(null);
        }
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
      Payment.findOne({id:paymentId})
      .then(function(payment){
        if(payment.isCancellation){
          return Promise.reject(new Error('No es posible cancelar un pago negativo'));
        }

        negativePayment = _.omit(payment,[
          'id',
          'folio',
          'createdAt',
          'updatedAt'
        ]);
        negativePayment.ammount = negativePayment.ammount * -1;
        negativePayment.isCancellation = true;

        return Payment.update({id:paymentId}, {isCancelled: true});
      })
      .then(function(paymentUpdated){
        sails.log.info('payment updated', paymentUpdated);
        return Payment.create(negativePayment);
      })
      .then(function(negativePaymentCreated){
        return calculateQuotationAmountPaid(quotationId);
      })
      .then(function(ammountPaid){
        var params = {
          ammountPaid: ammountPaid,
          paymentGroup: paymentGroup
        };
        return Quotation.update({id:quotationId}, params);
      })
      .then(function(){
        return Quotation.findOne({id: quotationId}).populate('Payments');
      })
      .then(function(updatedQuotation){
        res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });    
  },

  getPaymentGroups: function(req, res){
    var paymentGroups = PaymentService.getPaymentGroups();
    res.json(paymentGroups);
  }	
};

function calculateQuotationAmountPaid(quotationId){
  return Promise.join(
      Quotation.findOne({id: quotationId}).populate('Payments'),
      PaymentService.getExchangeRate()
    )
    .then(function(results){
      var quotation = results[0];
      var payments  = quotation.Payments || [];
      var exchangeRate = results[1];

      var ammounts = payments.map(function(p){
        if(p.type == 'cash-usd'){
         return p.ammount * exchangeRate;
        }
        return p.ammount;
      });
      var ammountPaid = ammounts.reduce(function(paymentA, paymentB){
        return paymentA + paymentB;
      });

      return ammountPaid;
    });  
}

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
/**
 * InvoiceController
 *
 * @description :: Server-side logic for managing invoices
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create: function(req, res) {
    var form = req.allParams();
    var order = form.order;
    Invoice
      .findOne({ order: order })
      .then(function(exists) {
        if (exists) throw new Error('invoice already exists');
        return  InvoiceService.createOrderInvoice(order);
      })
      .then(function(invoice) {
        return res.json(invoice);
      })
      .catch(function(err) {
        console.log('err invoice create', err);
        if (err.error && err.error.message) {
          err = new Error(err.error.message);
          return res.json(400, err);
        }
        if (err.error && err.error.error)  {
          err = new Error(err.error.error.message);
          return res.json(400, err);
        }
        if (err.error)  {
          err = new Error(err.error);
          return res.json(400, err);
        }
        return res.negotiate(err);
      });
  },

  find: function(req, res) {
    var form = req.allParams();
    var order = form.order;
    Invoice
      .find({ order: order })
      .then(function(order) {
        return res.json(order);
      })
      .catch(function(err) {
        return res.json(400, err);
      });
  },

  send: function(req, res) {
    var form = req.allParams();
    var order = form.order;
    InvoiceService
      .send(order)
      .then(function(order) {
        return res.json(order);
      })
      .catch(function(err) {
        if (err.error && err.error.message) {
          err = new Error(err.error.message);
          return res.negotiate(err);
        }
        if (err.error && err.error.error)  {
          err = new Error(err.error.error.message);
          return res.negotiate(err);
        }
        if (err.error)  {
          err = new Error(err.error);
          return res.negotiate(err);
        }
        return res.negotiate(err);
      });
  },
  SAPConciliation: async function(req,res){
    const { page, startingDate, endingDate, getAll } = req.allParams()
    var dateStart, dateEnd;
    // validations
    if (startingDate) {
      dateStart = new Date(startingDate).toISOString()
    } else {
      dateStart = "2019-02-01T00:00:00-05:00"
    }
    if (endingDate) {
      dateEnd = new Date(endingDate).toISOString()
    } else {
      dateEnd = "2019-06-01T00:00:00-05:00"
    }
    // retrieve for exportation
    let value = [];
    if (getAll) {
      let i = 1;
      let isRetrieving = true;
      while (isRetrieving) {
        const { value: SapValue } = await SapService.invoiceReport(i, dateStart, dateEnd);
        if (SapValue.length == 0) {
          isRetrieving = false
        } else {
          value = value.concat(SapValue) // append all
        }
        i++;
      }
    } else {
      // retrieve for single page
      const { value: SapValue } = await SapService.invoiceReport(page, dateStart, dateEnd);
      value = SapValue
    }
    Promise.all( value.map(async sapInvoice =>{
      try {
        let defaultStore = {name: 'Not found'}
        let defaultClient = {CardName:"Not found", CardCode: 'Not found'}
        let defaultUser = {name: 'Not found'}
        const quotation = await Quotation.findOne({ id: sapInvoice.U_MongoId }).populate("Store").populate("User").populate("Client");
        if(!quotation){
          return {
            alegraId: "Quotation not found on db",
            folio_cotizacion: "not found",
            fecha_cotizacion: "not found",
            folio_orden: "not found",
            fecha_orden: "not found",
            ...sapInvoice,
            quotation: {
              Store: defaultStore, Client: defaultClient, User: defaultUser
            }
          }
        }
        const order = await Order.findOne({ id: quotation.Order });
        if(!order){
          return {
            alegraId: "Order not found on db",
            folio_cotizacion: "not found",
            fecha_cotizacion: "not found",
            folio_orden: "not found",
            fecha_orden: "not found",
            ...sapInvoice,
            quotation: {
              Store: defaultStore, Client: defaultClient, User: defaultUser
            }
          }
        }
        const Alegra = await Invoice.findOne({ order: quotation.Order })
        let alegraId;
        if (Alegra) {
          alegraId = Alegra.alegraId;
        }
        return {
          Alegra,
          alegraId,
          folio_cotizacion: quotation.folio,
          fecha_cotizacion: quotation.createdAt,
          folio_orden: order.folio,
          fecha_orden: order.createdAt,
          ...sapInvoice,
          order,
          quotation,
        }
      }  catch (ex){
        console.log(ex)
      }
    })).then( data => {
      console.log("End fetch");
      res.json({data, total:180})
    })
  }
};


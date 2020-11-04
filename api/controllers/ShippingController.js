module.exports = {
  async product(req, res){
    try{
      const form = req.allParams();
      const {storeId, activeQuotationId, productCode} = form;

      const store = await Store.findOne({id:storeId}).populate('Warehouse');
      const product = await Common.nativeFindOne({ItemCode: productCode}, Product);
      const deliveries = await Shipping.product(product, store.Warehouse, activeQuotationId);    
      return res.json(deliveries);
    }
    catch(err){
      return res.negotiate(err);
    }
  }
};


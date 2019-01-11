describe('SapService', () => {
  let products = null;
  let orderDetails = null;
  let order = null;
  let quotation = null;
  let quotationDetails = null;
  let companies = null;

  before(async () => {
    Product.destroy();
    OrderDetail.destroy();
    Order.destroy();
    Quotation.destroy();
    QuotationDetail.destroy();
    Company.destroy();
    companies = [
      await Company.create({ WhsCode: '01' }),
      await Company.create({ WhsCode: '02' }),
    ];
    products = [
      await Product.create({
        ItemCode: 'product.itemCode.1',
        ItemName: 'product.itemName.1',
      }),
      await Product.create({
        ItemCode: 'product.itemCode.2',
        ItemName: 'product.itemName.2',
      }),
    ];
    quotationDetails = [
      await QuotationDetail.create({
        quantity: 1,
        Product: products[0],
        shipDate: new Date(),
        originalShipDate: new Date(),
        productDate: new Date(),
        shipCompany: companies[0],
        shipCompanyFrom: companies[1],
      }),
      await QuotationDetail.create({
        quantity: 2,
        Product: products[1],
        shipDate: new Date(),
        originalShipDate: new Date(),
        productDate: new Date(),
        shipCompany: companies[1],
        shipCompanyFrom: companies[0],
      }),
    ];
    quotation = await Quotation.create({ Details: quotationDetails });
    orderDetails = [
      await OrderDetail.create({
        quantity: 1,
        Product: products[0],
        shipDate: new Date(),
        originalShipDate: new Date(),
        productDate: new Date(),
        shipCompany: companies[0],
        shipCompanyFrom: companies[1],
        QuotationDetail: quotationDetails[0],
      }),
      await OrderDetail.create({
        quantity: 1,
        Product: products[0],
        shipDate: new Date(),
        originalShipDate: new Date(),
        productDate: new Date(),
        shipCompany: companies[1],
        shipCompanyFrom: companies[0],
        QuotationDetail: quotationDetails[1],
      }),
    ];
    order = await Order.create({
      Quotation: quotation,
      Details: orderDetails,
      status: 'paid',
      ammountPaid: 100,
    });
  });

  describe('cancelOrder', () => {
    it('should return Sap Cancelations documents', async () => {
      const result = await SapService.cancelOrder(order.id);
      expect(result).to.equal(1);
    });
  });
});

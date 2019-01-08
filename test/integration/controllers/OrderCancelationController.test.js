describe('OrderCancelationController', () => {
  let details = null;
  let products = null;
  before(async () => {
    products = [
      await Product.create({ ItemCode: 'product.ItemCode.1' }),
      await Product.create({ ItemCode: 'product.ItemCode.2' }),
    ];
  });
});

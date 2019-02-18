// describe('OrderCancelationController', () => {
//   let products = null;
//   let orderDetails = null;
//   let order = null;
//   let quotation = null;
//   let quotationDetails = null;
//   let companies = null;
//   before(async () => {
//     console.log('ENV: ', process.env.NODE_ENV);
//     Product.destroy();
//     OrderDetail.destroy();
//     Order.destroy();
//     Quotation.destroy();
//     QuotationDetail.destroy();
//     Company.destroy();
//     OrderCancelation.destroy();
//     Counter.destroy();
//     Counter.create({
//       name: 'orderFolio',
//       seq: 1,
//     });
//     Counter.create({
//       name: 'quotationFolio',
//       seq: 1,
//     });
//     companies = [
//       await Company.create({ WhsCode: '01' }),
//       await Company.create({ WhsCode: '02' }),
//     ];
//     products = [
//       await Product.create({
//         ItemCode: 'product.itemCode.1',
//         ItemName: 'product.itemName.1',
//       }),
//       await Product.create({
//         ItemCode: 'product.itemCode.2',
//         ItemName: 'product.itemName.2',
//       }),
//     ];
//     quotationDetails = [
//       await QuotationDetail.create({
//         quantity: 1,
//         Product: products[0],
//         shipDate: new Date(),
//         originalShipDate: new Date(),
//         productDate: new Date(),
//         shipCompany: companies[0],
//         shipCompanyFrom: companies[1],
//       }),
//       await QuotationDetail.create({
//         quantity: 2,
//         Product: products[1],
//         shipDate: new Date(),
//         originalShipDate: new Date(),
//         productDate: new Date(),
//         shipCompany: companies[1],
//         shipCompanyFrom: companies[0],
//       }),
//     ];
//     console.log('aqui no debe morir');
//     quotation = await Quotation.create({ Details: quotationDetails });
//     console.log('creo que aqui muere');
//     orderDetails = [
//       await OrderDetail.create({
//         quantity: 1,
//         Product: products[0],
//         shipDate: new Date(),
//         originalShipDate: new Date(),
//         productDate: new Date(),
//         shipCompany: companies[0],
//         shipCompanyFrom: companies[1],
//         QuotationDetail: quotationDetails[0],
//       }),
//       await OrderDetail.create({
//         quantity: 1,
//         Product: products[1],
//         shipDate: new Date(),
//         originalShipDate: new Date(),
//         productDate: new Date(),
//         shipCompany: companies[1],
//         shipCompanyFrom: companies[0],
//         QuotationDetail: quotationDetails[1],
//       }),
//     ];
//     console.log('llega hasta aqui');
//     order = await Order.create({
//       Quotation: quotation,
//       Details: orderDetails,
//       status: 'paid',
//       ammountPaid: 100,
//       CardName: 'order.cardName.1',
//     });
//   });
//   describe('add', () => {
//     it('should create a OrderCancelation record with cancelAll as true', async () => {
//       const url = `/cancel/${order.id}/order`;
//       const params = {
//         cancelAll: true,
//         details: [],
//         reason: 'Test reason',
//       };
//       const { status, body } = await app.post(url, params);
//       console.log('body: ', body);
//       expect(status).to.equal(200);
//     });
//   });
// });

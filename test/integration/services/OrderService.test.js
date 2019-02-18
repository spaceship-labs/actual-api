// describe('SapService', () => {
//   let quotationDetail = null;
//   let products = null;
//   let quotation = null;
//   let user = null;
//   let store = null;
//   let order = null;
//   let companies = null;

//   before(async () => {
//     Quotation.destroid();
//     QuotationDetail.destroid();
//     Company.destroy();
//     Product.destroy();

//     User.destroid();
//     Store.destroid();
//     Order.destroid();

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

//     quotationDetail = [
//       await QuotationDetail.create({
//         shipDate: new Date(),
//         originalShipDate: new Date(),
//         productDate: new Date(),
//         Product: products[0],
//         shipCompany: companies[0],
//         shipCompanyFrom: companies[1],
//       }),
//       await QuotationDetail.create({
//         shipDate: new Date(),
//         originalShipDate: new Date(),
//         productDate: new Date(),
//         Product: products[1],
//         shipCompany: companies[1],
//         shipCompanyFrom: companies[0],
//       }),
//     ];

//     quotation = await Quotation.create({ Details: quotationDetail });

//     store = await Store.create({ name: 'testStore' });

//     user = await User.create({
//       email: 'test@test.com',
//       activeStore: store,
//     });

//     order = await Order.create({
//       user: user,
//       Quotation: quotation,
//     });
//   });
// });

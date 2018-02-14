module.exports = {
	"env": {
		"node": true
	},
	"parserOptions": {
	"ecmaVersion": 2017
	},
	"parser": "esprima",
  "rules": {
		"no-console": 0,
		"semi": "error"
	},
	"extends": "eslint:recommended",
	"globals": {
		"sails": true,
		"before": true,
		"after": true,
		"it": true,
		"should":true,
		"describe":true,		
		"AuthController": true,
		"BrokerController": true,
		"ClientController": true,
		"CommissionController": true,
		"CommonController": true,
		"CompanyController": true,
		"CustomBrandController": true,
		"GoalController": true,
		"ImportController": true,
		"InvoiceController": true,
		"LoggingController": true,
		"MeController": true,
		"OrderController": true,
		"PMPeriodController": true,
		"PackageController": true,
		"PaymentController": true,
		"PermissionController": true,
		"ProductBrandController": true,
		"ProductCategoryController": true,
		"ProductController": true,
		"ProductFilterController": true,
		"ProductFilterValueController": true,
		"ProductGroupController": true,
		"ProductSearchController": true,
		"ProductSizeController": true,
		"PromotionController": true,
		"QuotationController": true,
		"RoleController": true,
		"SellerController": true,
		"ShippingController": true,
		"SiteController": true,
		"StoreController": true,
		"SyncController": true,
		"UserController": true,
		"AlegraLog": true,
		"BrokerSAP": true,
		"Client": true,
		"ClientBalanceRecord": true,
		"ClientContact": true,
		"ClientCredit": true,
		"ClientDiscount": true,
		"Commission": true,
		"Company": true,
		"Counter": true,
		"CustomBrand": true,
		"DatesDelivery": true,
		"Delivery": true,
		"EwalletRecord": true,
		"FiscalAddress": true,
		"Goal": true,
		"Invoice": true,
		"ItemWarehouse": true,
		"Logging": true,
		"Order": true,
		"OrderDetail": true,
		"OrderSap": true,
		"PMPeriod": true,
		"PackageRule": true,
		"Payment": true,
		"PaymentSap": true,
		"Permission": true,
		"Product": true,
		"ProductBrand": true,
		"ProductCategory": true,
		"ProductFile": true,
		"ProductFilter": true,
		"ProductFilterValue": true,
		"ProductGroup": true,
		"ProductSerie": true,
		"ProductSize": true,
		"Product_ProductCategory": true,
		"Product_ProductFilterValue": true,
		"Product_ProductGroup": true,
		"Promotion": true,
		"PurchaseOrder": true,
		"Quotation": true,
		"QuotationAddress": true,
		"QuotationDetail": true,
		"QuotationRecord": true,
		"QuotationRecordFile": true,
		"Role": true,
		"SapOrderConnectionLog": true,
		"Season": true,
		"Seller": true,
		"Site": true,
		"State": true,
		"Store": true,
		"User": true,
		"CategoryService": true,
		"CipherService": true,
		"ClientBalanceService": true,
		"ClientService": true,
		"Commissions": true,
		"Common": true,
		"CronJobs": true,
		"Email": true,
		"EwalletService": true,
		"Files": true,
		"InvoiceService": true,
		"Logger": true,
		"OrderService": true,
		"PaymentService": true,
		"ProductService": true,
		"PromotionService": true,
		"QuotationService": true,
		"SapService": true,
		"Search": true,
		"Shipping": true,
		"StockService": true,
		"StoreService": true,
		"SyncService": true,
		"TransferService": true
	}
};
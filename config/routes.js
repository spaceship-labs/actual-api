module.exports.routes = {
  'get /': 'AuthController.homeStatus',

  '/auth/signin': {
    controller: 'auth',
    action: 'signin',
  },

  '/auth/manager': {
    controller: 'auth',
    action: 'authorizeManager',
  },

  '/user/create': {
    controller: 'user',
    action: 'create',
  },

  '/user/findbyid/:id': {
    controller: 'user',
    action: 'findById',
  },

  '/user/find/:page': {
    controller: 'user',
    action: 'find',
  },

  '/user/update/:id': {
    controller: 'user',
    action: 'update',
  },

  '/userweb/create': {
    controller: 'userweb',
    action: 'create',
  },

  '/userweb/findbyid/:id': {
    controller: 'userweb',
    action: 'findById',
  },

  '/userweb/find/:page': {
    controller: 'userweb',
    action: 'find',
  },

  '/userweb/update/:id': {
    controller: 'userweb',
    action: 'update',
  },

  '/product/find/:page': {
    controller: 'product',
    action: 'find',
  },

  '/product/multiplefindbyids': {
    controller: 'product',
    action: 'multipleFindByIds',
  },

  '/product/search': {
    controller: 'product',
    action: 'search',
  },

  '/product/addfiles': {
    controller: 'product',
    action: 'addFiles',
  },

  '/product/removefiles': {
    controller: 'product',
    action: 'removeFiles',
  },

  '/product/updateicon': {
    controller: 'product',
    action: 'updateIcon',
  },

  '/product/removeicon': {
    controller: 'product',
    action: 'removeIcon',
  },

  '/product/findbyid/:id': {
    controller: 'product',
    action: 'findById',
  },

  'post /spotlightproducts': {
    controller: 'product',
    action: 'setSpotlightProducts',
  },

  'get /spotlightproducts': {
    controller: 'product',
    action: 'getSpotlightProducts',
  },

  'post /slowmovementproducts': {
    controller: 'product',
    action: 'setSlowMovementProducts',
  },

  'get /slowmovementproducts': {
    controller: 'product',
    action: 'getSlowMovementProducts',
  },

  '/sync/syncproductbyitemcode/:itemcode': {
    controller: 'sync',
    action: 'syncProductByItemCode',
  },

  '/sync/syncclientbycardcode/:cardcode': {
    controller: 'sync',
    action: 'syncClientByCardCode',
  },

  '/sync/clientsdiscounts': {
    controller: 'sync',
    action: 'syncClientsDiscounts',
  },

  '/sync/clientscredit': {
    controller: 'sync',
    action: 'syncClientsCredit',
  },

  '/product/update/:id': {
    controller: 'product',
    action: 'update',
  },

  '/product/getproductsbysuppcatnum/:id': {
    controller: 'product',
    action: 'getProductsbySuppCatNum',
  },

  '/product/addseen/:ItemCode': {
    controller: 'product',
    action: 'addSeenTime',
  },

  '/product/mainpromo/:id': {
    controller: 'product',
    action: 'getProductMainPromo',
  },

  /*
  '/product/sync/:ItemCode':{
    controller:'product',
    action:'syncProduct'
  },
  */

  '/invoice/find/:page': {
    controller: 'invoice',
    action: 'find',
  },

  '/productcategory/find/:page': {
    controller: 'productcategory',
    action: 'find',
  },

  '/productcategory/create': {
    controller: 'productcategory',
    action: 'create',
  },

  '/productcategory/getallcategories': {
    controller: 'productcategory',
    action: 'getAllCategories',
  },

  '/productcategory/getcategoriesgroups': {
    controller: 'productcategory',
    action: 'getCategoriesGroups',
  },

  '/productcategory/getmaincategories': {
    controller: 'productcategory',
    action: 'getMainCategories',
  },

  '/productcategory/findbyid/:id': {
    controller: 'productcategory',
    action: 'findById',
  },

  '/productcategory/findbyhandle/:handle': {
    controller: 'productcategory',
    action: 'findByHandle',
  },

  '/productcategory/destroy/:id': {
    controller: 'productcategory',
    action: 'destroy',
  },

  '/productcategory/update/:id': {
    controller: 'productcategory',
    action: 'update',
  },

  '/productcategory/getcategoriestree': {
    controller: 'productcategory',
    action: 'getCategoriesTree',
  },

  '/productcategory/childsrelations/:handle': {
    controller: 'productcategory',
    action: 'getCategoryChildsRelations',
  },

  '/productcategory/setchildsrelations/:handle': {
    controller: 'productcategory',
    action: 'setCategoryChildsRelations',
  },

  '/productfilter/find/:page': {
    controller: 'productfilter',
    action: 'find',
  },

  '/productfilter/list': {
    controller: 'productfilter',
    action: 'list',
  },

  '/productfilter/create': {
    controller: 'productfilter',
    action: 'create',
  },

  '/productfilter/findbyid/:id': {
    controller: 'productfilter',
    action: 'findById',
  },

  '/productfilter/destroy/:id': {
    controller: 'productfilter',
    action: 'destroy',
  },

  '/productfiltervalue/create': {
    controller: 'productfiltervalue',
    action: 'create',
  },

  '/productfiltervalue/update/:id': {
    controller: 'productfiltervalue',
    action: 'update',
  },

  '/productfiltervalue/destroy/:id': {
    controller: 'productfiltervalue',
    action: 'destroy',
  },

  '/productbrand/getall': {
    controller: 'productbrand',
    action: 'getAll',
  },

  // 'get /custombrand': 'CustomBrandController.index',
  '/custombrand/find/:page': {
    controller: 'custombrand',
    action: 'find',
  },

  '/custombrand/getall': {
    controller: 'custombrand',
    action: 'index',
  },

  '/custombrand/create': {
    controller: 'custombrand',
    action: 'create',
  },

  '/custombrand/update/:id': {
    controller: 'custombrand',
    action: 'update',
  },

  '/custombrand/findbyid/:id': {
    controller: 'custombrand',
    action: 'show',
  },

  '/custombrand/destroy/:id': {
    controller: 'custombrand',
    action: 'destroy',
  },

  '/productsize/create': {
    controller: 'productsize',
    action: 'create',
  },

  '/productsize/update/:id': {
    controller: 'productsize',
    action: 'update',
  },

  '/productsize/destroy/:id': {
    controller: 'productsize',
    action: 'destroy',
  },

  '/productgroup/find/:page': {
    controller: 'productgroup',
    action: 'find',
  },

  '/productgroup/findbyid/:id': {
    controller: 'productGroup',
    action: 'findById',
  },

  '/productgroup/create': {
    controller: 'productgroup',
    action: 'create',
  },

  '/productgroup/update/:id': {
    controller: 'productgroup',
    action: 'update',
  },

  '/productgroup/destroy/:id': {
    controller: 'productgroup',
    action: 'destroy',
  },

  '/productgroup/addproducttogroup': {
    controller: 'productgroup',
    action: 'addProductToGroup',
  },

  '/productgroup/removeproductfromgroup': {
    controller: 'productgroup',
    action: 'removeProductFromGroup',
  },

  '/productgroup/search': {
    controller: 'productgroup',
    action: 'search',
  },

  '/productgroup/updateicon': {
    controller: 'productgroup',
    action: 'updateIcon',
  },

  '/productgroup/removeicon': {
    controller: 'productgroup',
    action: 'removeIcon',
  },

  /*
  '/import/importimagessap': {
    controller: 'import',
    action: 'importImagesSap'
  },

  '/import/importbrokers': {
    controller: 'import',
    action: 'importBrokersToUsers'
  },
  */

  '/brokers': {
    controller: 'broker',
    action: 'list',
  },

  '/seller/getall': {
    controller: 'seller',
    action: 'getAll',
  },

  '/client/find': {
    controller: 'client',
    action: 'find',
  },

  // 'get /client/:id': 'ClientController.findById',

  '/client/findbyid/:id': {
    controller: 'client',
    action: 'findById',
  },

  '/client/:CardCode/contacts': {
    controller: 'client',
    action: 'getContactsByClient',
  },

  '/client/:CardCode/update/contact/:CntctCode': {
    controller: 'client',
    action: 'updateContact',
  },

  '/client/:CardCode/contact/create': {
    controller: 'client',
    action: 'createContact',
  },

  /*
  '/client/:CardCode/fiscaladdress/create':{
    controller:'client',
    action:'createFiscalAddress'
  },
  */

  '/client/update/fiscaladdress/:id/:CardCode': {
    controller: 'client',
    action: 'updateFiscalAddress',
  },

  '/client/:id/ewallet': {
    controller: 'client',
    action: 'getEwalletByClient',
  },

  '/client/:id/balance': {
    controller: 'client',
    action: 'getClientBalance',
  },

  '/quotation/create': {
    controller: 'quotation',
    action: 'create',
  },

  '/quotation/update/:id': {
    controller: 'quotation',
    action: 'update',
  },

  '/quotation/findbyid/:id': {
    controller: 'quotation',
    action: 'findById',
  },

  '/quotation/findbyidquickread/:id': {
    controller: 'quotation',
    action: 'findByIdQuickRead',
  },

  '/quotation/findbyclient/:page': {
    controller: 'quotation',
    action: 'findByClient',
  },

  '/quotation/find/:page': {
    controller: 'quotation',
    action: 'find',
  },

  '/quotation/user/:userId/totals': {
    controller: 'quotation',
    action: 'getTotalsByuser',
  },

  '/quotation/users/totals': {
    controller: 'quotation',
    action: 'getMultipleUsersTotals',
  },

  '/quotation/user/:userId/count': {
    controller: 'quotation',
    action: 'getCountByUser',
  },

  '/quotation/:id/records': {
    controller: 'quotation',
    action: 'getRecords',
  },

  '/quotation/addrecord/:id': {
    controller: 'quotation',
    action: 'addRecord',
  },

  '/quotation/:id/estimatedclosedate': {
    controller: 'quotation',
    action: 'setEstimatedCloseDate',
  },

  '/quotation/adddetail/:id': {
    controller: 'quotation',
    action: 'addDetail',
  },

  '/quotation/addmultipledetails/:id': {
    controller: 'quotation',
    action: 'addMultipleDetails',
  },

  '/quotation/removedetailsgroup/:quotation': {
    controller: 'quotation',
    action: 'removeDetailsGroup',
  },

  '/quotation/totals/:id': {
    controller: 'quotation',
    action: 'getQuotationTotals',
  },

  '/quotation/sendemail/:id': {
    controller: 'quotation',
    action: 'sendEmail',
  },

  '/order/sendemail/:id': {
    controller: 'order',
    action: 'sendOrderEmail',
  },

  '/quotation/:id/source': {
    controller: 'quotation',
    action: 'updateSource',
  },

  '/quotation/:id/broker': {
    controller: 'quotation',
    action: 'updateBroker',
  },

  '/quotation/:id/validatestock': {
    controller: 'quotation',
    action: 'validateStock',
  },

  '/quotation/:id/close': {
    controller: 'quotation',
    action: 'closeQuotation',
  },

  '/quotation/:id/paymentoptions': {
    controller: 'quotation',
    action: 'getQuotationPaymentOptions',
  },

  '/quotation/:id/saporderconnectionlogs': {
    controller: 'quotation',
    action: 'getQuotationSapLogs',
  },

  'GET /quotation/:id/payments': {
    controller: 'quotation',
    action: 'getQuotationPayments',
  },

  'POST /quotation/:quotationId/payments': {
    controller: 'payment',
    action: 'add',
  },

  '/payment/:id/cancel': {
    controller: 'payment',
    action: 'cancel',
  },

  '/client/update/:CardCode': {
    controller: 'client',
    action: 'update',
  },

  '/product/advancedsearch': {
    controller: 'productsearch',
    action: 'advancedSearch',
  },

  '/product/searchbyfilters': {
    controller: 'productsearch',
    action: 'searchByfilters',
  },

  '/product/searchbycategory': {
    controller: 'productsearch',
    action: 'searchByCategory',
  },

  '/order/find/:page': {
    controller: 'order',
    action: 'find',
  },
  'GET /order/findbyfilter': {
    controller: 'order',
    action: 'findbyfilter',
  },

  'POST /order': {
    controller: 'order',
    action: 'create',
    skipAssets: true,
  },

  '/order/findbyid/:id': {
    controller: 'order',
    action: 'findById',
  },

  'POST /order/:id/cancel/:details': {
    controller: 'order',
    action: 'cancel',
  },

  '/order/user/:userId/totals': {
    controller: 'order',
    action: 'getTotalsByuser',
  },

  // CANCELATIONS

  'GET /order': {
    controller: 'order',
    action: 'index',
  },

  'GET /cancel/:id/order': {
    controller: 'ordercancelation',
    action: 'show',
  },

  'GET /cancel': {
    controller: 'ordercancelation',
    action: 'index',
  },

  'POST /cancel/:orderId/order': {
    controller: 'ordercancelation',
    action: 'add',
  },

  'PUT /cancel/:id/order': {
    controller: 'ordercancelation',
    action: 'update',
  },
  'GET /cancel/findbyfilter': {
    controller: 'ordercancelation',
    action: 'findbyfilter',
  },
  // CANCELATIONS

  '/order/user/:userId/count': {
    controller: 'order',
    action: 'getCountByUser',
  },

  '/order/invoicelogs/:orderId': {
    controller: 'order',
    action: 'getInvoicesLogs',
  },

  '/me/update': {
    controller: 'me',
    action: 'update',
  },

  '/me/managercashreport': {
    controller: 'me',
    action: 'managerCashReport',
  },

  '/promotion/create': {
    controller: 'promotion',
    action: 'create',
  },

  '/promotion/find/:page': {
    controller: 'promotion',
    action: 'find',
  },

  '/promotion/findbyid/:id': {
    controller: 'promotion',
    action: 'findById',
  },

  '/promotion/update/:id': {
    controller: 'promotion',
    action: 'update',
  },

  '/promotion/searchproducts': {
    controller: 'promotion',
    action: 'searchPromotionProducts',
  },

  '/pmperiod/create': {
    controller: 'pmperiod',
    action: 'create',
  },

  '/pmperiod/update/:id': {
    controller: 'pmperiod',
    action: 'update',
  },

  '/pmperiod/find/:page': {
    controller: 'pmperiod',
    action: 'find',
  },

  '/pmperiod/findbyid/:id': {
    controller: 'pmperiod',
    action: 'findById',
  },

  '/pmperiod/getactive': {
    controller: 'pmperiod',
    action: 'getActive',
  },

  '/site/update/:handle': {
    controller: 'site',
    action: 'update',
  },

  '/site/findbyhandle/:handle': {
    controller: 'site',
    action: 'findByHandle',
  },

  '/site/addbanner': {
    controller: 'site',
    action: 'addBanner',
  },

  '/site/removefiles': {
    controller: 'site',
    action: 'removeFiles',
  },

  '/sites': {
    controller: 'site',
    action: 'getAll',
  },

  '/sites/find/:page': {
    controller: 'site',
    action: 'find',
  },

  '/store/find': {
    controller: 'store',
    action: 'find',
  },

  'GET /stores/:id': {
    controller: 'store',
    action: 'getById',
  },

  '/store/:id/packages': {
    controller: 'store',
    action: 'getPackagesByStore',
  },

  '/store/:id/sellers': {
    controller: 'store',
    action: 'getSellersByStore',
  },

  '/stores/globalcashreport': {
    controller: 'store',
    action: 'generateGlobalCashReport',
  },

  '/common/states': {
    controller: 'common',
    action: 'getStates',
  },

  '/packages/find/:page': {
    controller: 'package',
    action: 'findPackages',
  },

  '/packages/:id/products': {
    controller: 'package',
    action: 'getProducts',
  },

  '/packages/update/:id': {
    controller: 'package',
    action: 'update',
  },

  '/packages/details/:id': {
    controller: 'package',
    action: 'getDetailedPackage',
  },

  '/quotation/getcurrentstock/:quotationId': {
    controller: 'quotation',
    action: 'getCurrentStock',
  },

  '/paymentgroups': {
    controller: 'payment',
    action: 'getPaymentGroups',
  },

  '/paymentwebgroups': {
    controller: 'paymentweb',
    action: 'getPaymentWebGroups',
  },

  '/srservices': {
    controller: 'srservice',
    action: 'find',
  },

  'GET /zipcodestates': {
    controller: 'zipcode',
    action: 'listZipcodeStates',
  },

  '/zipcodestates/multipleupdate': {
    controller: 'zipcode',
    action: 'multipleUpdate',
  },

  'GET /featuredproduct/:site': {
    controller: 'featuredproduct',
    action: 'index',
  },
  'POST /featuredproduct': {
    controller: 'featuredproduct',
    action: 'create',
  },
  'POST /featuredproduct/:id': {
    controller: 'featuredproduct',
    action: 'remove',
  },
  'POST /ewallet/:page': {
    controller: 'ewallet',
    action: 'index',
  },
  '/ewallet/:client/:cardNumber': {
    controller: 'ewallet',
    action: 'showOrCreate',
  },
  '/ewallet/:cardNumber': {
    controller: 'ewallet',
    action: 'show',
  },
  'GET /ewallet/:id/client': {
    controller: 'ewallet',
    action: 'getById',
  },
  'GET /ewalletconfiguration': {
    controller: 'ewalletconfiguration',
    action: 'show',
  },
  'POST /ewalletconfiguration': {
    controller: 'ewalletconfiguration',
    action: 'create',
  },
  'POST /ewalletconfiguration/:id': {
    controller: 'ewalletconfiguration',
    action: 'update',
  },
  'POST /ewalletrecord/:page': {
    controller: 'ewalletrecord',
    action: 'index',
  },
  'POST /ewalletreplacement/:page': {
    controller: 'ewalletreplacement',
    action: 'index',
  },
  'POST /ewalletreplacement/:page': {
    controller: 'ewalletreplacement',
    action: 'index',
  },
  'POST /replacementupdate/:clientId': {
    controller: 'ewalletreplacement',
    action: 'add',
  },
  'POST /replacementaccepted/:id': {
    controller: 'ewalletreplacement',
    action: 'update',
  },
  'GET /alert': {
    controller: 'alert',
    action: 'index',
  },

  /***************************************************************************
   *                                                                          *
   * Custom routes here...                                                    *
   *                                                                          *
   * If a request to a URL doesn't match any of the custom routes above, it   *
   * is matched against Sails route blueprints. See `config/blueprints.js`    *
   * for configuration options and examples.                                  *
   *                                                                          *
   ***************************************************************************/
};

module.exports = {
	getSitesCashReport: getSitesCashReport
};

function getSitesCashReport(params){
	var sitesStoresNames = [
		'actualstudio.com',
		'actualhome.com',
		'actualkids.com'
	];

  var startDate = params.startDate || new Date();
  var endDate = params.endDate || new Date();
  var queryPayments = {
  	createdAt: { '>=': startDate, '<=': endDate },
  	status: {'!':'cancelled'}
  };

	return Store.find({name:sitesStoresNames}).populate('PaymentsWeb',queryPayments)
		.then(function(stores){
			return stores;
		});

}
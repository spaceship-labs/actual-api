var moment = require('moment');

module.exports = {

	syncData: function(req, res){
		var form = req.params.all();
		var _model = form.table;
		SyncService.sync(_model).then(function(results){
			res.ok({data:results});
		},function(err){
			res.ok({data:err});
		})
	}
};


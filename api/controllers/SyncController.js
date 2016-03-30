var moment = require('moment');
var async = require('async');
var q = require('q');

module.exports = {

	syncData: function(req, res){
		var form = req.params.all();
		var _model = form.table;
		SyncService.sync(_model).then(function(results){
			res.ok({data:results});
		},function(err){
			res.ok({data:err});
		})
	},

	syncAll: function(req, res){
		var timeOut = 60*60*1000;
		var tables = Object.keys(sails.config.tables);		
		req.connection.setTimeout(timeOut); //
		var results = [];

		function go (tables) {
		    if (tables[0]) {
	      		SyncService.sync(tables[0]).then(function (result) {
		          	go(tables.slice(1));
		      	});
		    }else{
		    	res.json({data:results});
		    }
		}
		go(tables);
	}
};


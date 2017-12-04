var Promise = require('bluebird');

module.exports = {
	getZipcodeStatesByAggregate: getZipcodeStatesByAggregate
};

function getZipcodeStatesByAggregate(){
	return new Promise(function(resolve, reject){

		ZipcodeDelivery.native(function(err, collection){
			if(err){
				return reject(err);
			}

			var group = {_id: "$estado", count: {$sum: 1}};
			var project = {_id: 0, name: "$_id", count: 1};

			collection.aggregate([{$group: group}, {$project: project}], function(err2, results){
				if(err2) return reject(err2);
				console.log('results', results);
				resolve(results);
			});
		});

	});
}

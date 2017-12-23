var fs = require('fs');
var path = require('path');
var esi = require('eve-swagger');

module.exports = function (setup) {
	var module = {};
	module.list = [];
	module.createCacheVariable = function(cb) {
	try {
		if (module.list.length === 0) {
			fs.readFile(path.normalize(`${__dirname}/${setup.data.directory}/cache.json`), function(err, data) {
				if (typeof data !== 'undefined') {
					module.list = JSON.parse(data);
				}
				cb();
			});
		} else {
			cb()
		}
		
	} catch (e) {
		console.log("No cache found.");
		cb()
	}
};

	module.query = function(id, cb) {
		esi.names(id).then(function(item) {
			cb(item[0])
		})
	}

	module.get = function(id, cb) {
		module.createCacheVariable(function() {
			var found = false;
			for (var i = 0; i < module.list.length; i++) {
				if (module.list[i].id === id) {
					cb(module.list[i]);
					var found = true;
					break;
				}
			}
			if (!found) {
				module.query(id, function(item) {
					module.list.push(item);
					cb(item);
					module.saveCacheData();
				})
			}
			
		})
	}

		module.saveCacheData = function() {
			try {
				fs.writeFileSync(path.normalize(`${__dirname}/${setup.data.directory}/cache.json`), JSON.stringify(module.list, null, 2));
			} catch (e) {
				console.log(e)
				console.log("Failed to save cache data");
			}
		};

	return module;
}
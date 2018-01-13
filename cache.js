var fs = require('fs');
var path = require('path');
var esi = require('eve-swagger');

module.exports = function (setup) {
	var module = {};
	module.list = [];
	module.createCacheVariable = function(cb) {
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
};

	module.query = function(id, cb) {
		if (typeof id === "number" || typeof id === "string") {
			id = new Array(id);
		}
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
					found = true;
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

	module.massQuery = function(ids, cb) {
		module.createCacheVariable(function() {
			var fullquery = [];
			for (var i = 0; i < ids.length; i++) {
				var found = false;
				for (var x = 0; x < module.list.length; x++) {
					if (ids[i] === module.list[x].id) {
						found = true;
					}
				}
				if (!found) {
					fullquery.push(ids[i]);
				}
			}
			if (fullquery.length > 0) {
				esi.names(fullquery).then(function(items) {
					for (var i = 0; i < items.length; i++) {
						module.list.push(items[i]);
					}
					module.saveCacheData();
					if (typeof cb === "function") {
						cb(items);
					}
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
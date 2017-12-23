var fs = require('fs');
var path = require('path');
var esi = require('eve-swagger');

module.exports = function (setup) {
	var module = {};
	module.list = [];

/*
Fleet object format:

{
	fc: user object,
	backseat: user object,
	type: "hq",
	status: "text",
	location: {
		id: id,
		name: "Jita"
	},
	members: [user objects],
	size: members.length,
	url: "hhttps://esi.tech.ccp.is..."
}

*/

	module.createFleetsVariable = function(cb) {
		try {
			if (module.list.length === 0) {
				fs.readFile(path.normalize(`${__dirname}/${setup.data.directory}/fleets.json`), function(err, data) {
					if (typeof data !== 'undefined') {
						module.list = JSON.parse(data);
						console.log("Existing fleets found: " + module.list.length);
					}
					cb();
				});
			} else {
				cb()
			}
			
		} catch (e) {
			console.log("No fleets found.");
			cb()
		}
		return module.list;
	};

	module.updateMembers = function(cb) {
		console.log("Members updating...")

	}

	module.register = function(data) {
		data.timer = setTimeout()
		module.list.push(data); //Do I want the calling function to do all the work?
		module.saveFleetData();
	}

	module.saveFleetData = function() {
	try {
		fs.writeFileSync(path.normalize(`${__dirname}/${setup.data.directory}/fleets.json`), JSON.stringify(module.list, null, 2));
	} catch (e) {
		console.log(e)
		console.log("Failed to save fleet data");
	}
};


	module.getFCPageList = function(cb) {
		module.createFleetsVariable(function() {
			cb(module.list)
		})
	}


	return module;
}
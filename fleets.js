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
					module.list = JSON.parse(data);
					console.log("Existing fleets found: " + module.list.length);
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

	module.register = function(data) {
		module.list.push(data); //Do I want the calling function to do all the work?
	}


	module.getFCPageList = function(cb) {
		module.createFleetsVariable(function() {
			cb()
		})
	}


	return module;
}
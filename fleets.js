var fs = require('fs');
var path = require('path');
var esi = require('eve-swagger');
var refresh = require('passport-oauth2-refresh');
var setup = require('./setup.js');
var users = require('./users.js')(setup);
var cache = require('./cache.js')(setup);

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

	module.get = function(id, cb) {
		module.createFleetsVariable(function() {
			for (var i = 0; i < module.list.length; i++) {
				if (module.list[i].id == id) {
					cb(module.list[i]);
					break;
				}
			}
		})
	}

	module.getMembers = function(characterID, refreshToken, fleetid, cb) {
		refresh.requestNewAccessToken('provider', refreshToken, function(err, accessToken, newRefreshToken) {
			if (err) console.log(err);
			users.updateRefreshToken(characterID, newRefreshToken);
			esi.characters(characterID, accessToken).fleet(fleetid).members().then(function(members) {
				cb(members, fleetid)
			});
		});
	}

	module.register = function(data) {
		module.createFleetsVariable(function() {
			module.list.push(data); //Do I want the calling function to do all the work?
			module.saveFleetData();
		})
	}

	module.saveFleetData = function() {
		module.createFleetsVariable(function() {
			try {
				fs.writeFileSync(path.normalize(`${__dirname}/${setup.data.directory}/fleets.json`), JSON.stringify(module.list, null, 2));
			} catch (e) {
				console.log(e)
				console.log("Failed to save fleet data");
			}
	})
};


	module.getFCPageList = function(cb) {
		module.createFleetsVariable(function() {
			cb(module.list)
		})
	}


	module.timers = function() {	
		setTimeout(function() {
			module.createFleetsVariable(function() {
				var count = 0;
				for (var i = 0; i < module.list.length; i++) {
					console.log("Updating members for "+module.list[i].id)
					module.getMembers(module.list[i].fc.characterID, module.list[i].fc.refreshToken, module.list[i].id, function(members, fleetid) {
						console.log(members)
						for (var x = 0; x < module.list.length; x++) {
							if (module.list[x].id === fleetid) {
								module.list[x].members = members;
								break;
							}
						}

						//loop through members and grab all the static ID's
						var staticIDs = [];
						for (var f = 0; f < members.length; f++) {
							staticIDs.push(members[f].ship_type_id);
							staticIDs.push(members[f].solar_system_id);
						}
						cache.massQuery(staticIDs);

						
						count++;
						console.log(`Count: ${count}, i: ${i}`)
						if (count == i) {
							console.log("saving");
							module.saveFleetData();
							module.timers();
						}
					})
				}
			});
		}, 10000)

	}


	return module;
}
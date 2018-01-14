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
			var found = false;
			for (var i = 0; i < module.list.length; i++) {
				if (module.list[i].id == id) {
					found = true;
					cb(module.list[i], true);
					break;
				}
			}
			if (!found) {
				cb(null, false);
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

	module.register = function(data, cb) {
		module.createFleetsVariable(function() {
			module.get(data.id, function(fleets, fleetCheck) {
				console.log("Fleet has been found: " + fleetCheck);
				if (!fleetCheck) {
					module.list.push(data); //Do I want the calling function to do all the work?
					module.saveFleetData(module.list, function() {
						//Debug stuff here
						cb(true);
					});
				} else {
					cb(false, "This fleet ID has already been registered. Are you trying to register the same fleet twice?");
				}
			});
		})
	}

	module.saveFleetData = function(data, cb) {
		fs.writeFile(path.normalize(`${__dirname}/${setup.data.directory}/fleets.json`), JSON.stringify(data, null, 2), function(err) {
			if (err) console.log(err);
			cb();
		});
	};


	module.getFCPageList = function(cb) {
		module.createFleetsVariable(function() {
			cb(module.list)
		})
	}

	module.delete = function(id, cb) {
		module.createFleetsVariable(function() {
			for (var i = 0; i < module.list.length; i++) {
				if (module.list[i].id == id) {
					console.log("Deleted fleet: " + id);
					module.list.splice(i, 1);
					module.saveFleetData(module.list, function() {
						cb();
					});
				}
			}
		});
	}


	module.timers = function() {	
		//TODO: Replace this with a proper fleet lookup method that uses the expiry and checks for errors
		setTimeout(function() {
			module.createFleetsVariable(function() {
				var count = 0;
				for (var i = 0; i < module.list.length; i++) {
					module.getMembers(module.list[i].fc.characterID, module.list[i].fc.refreshToken, module.list[i].id, function(members, fleetid) {
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
						if (count == i) {
							module.saveFleetData(module.list, function() {
								//Debug Stuff Here
							});
						}
					})
				}
				module.timers();
			});
		}, 10000)

	}


	return module;
}
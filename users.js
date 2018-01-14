const path = require('path');
const fs = require('fs');
var setup = require('./setup.js');
var refresh = require('passport-oauth2-refresh');
var esi = require('eve-swagger');
var cache = require('./cache.js')(setup);

module.exports = function (setup) {
	var module = {};
	module.list = [];
	//I hate this and it sucks. It needs replacing with a database.
	module.createUsersVariable = function(cb) {
		try {
			if (module.list.length === 0) {
				fs.readFile(path.normalize(`${__dirname}/${setup.data.directory}/registeredUsers.json`), function(err, data) {
					if (typeof data !== 'undefined') {
						module.list = JSON.parse(data);
					}
					cb();
				});
			} else {
				cb()
			}
			
		} catch (e) {
			console.log("No users found.");
		}
		return module.list;
	};

	//Create and manage users - Currently doing this via JSON and saving the object every now and then. TODO: MongoDB with mongoose maybe?
	module.findOrCreateUser = function(users, refreshToken, characterDetails, cb) {
		//Check if the user exists
		module.findAndReturnUser(characterDetails.CharacterID, function(userProfile){
			//We found the user, return it back to the callback
			if (userProfile) {
				console.log(`Known user ${userProfile.name} has logged in.`);
				cb(userProfile);
			} else {
				//We didn't find the user, create them as a master account
				console.log(`Creating a new user for ${characterDetails.CharacterName}.`);
				generateNewUser(refreshToken, characterDetails, null, null, function(userProfile) {
					cb(userProfile);
				});
			}
		});
	};

	module.findAndReturnUser = function(checkID, cb) {
		module.createUsersVariable(function() {
			var userProfile = false;
			for (var i = 0; i < module.list.length; i++) {
				if (module.list[i].characterID == checkID) {
					userProfile = module.list[i];
					break;
				}
			}
			cb(userProfile);
		});
	};

	module.updateRefreshToken = function(checkID, token) {
		for (var i = 0; i < module.list.length; i++) {
			if (module.list[i].characterID == checkID) {
				module.list[i].refreshToken = token;
				module.saveUserData();
				break;
			}
		}
	}

	module.saveUserData = function() {
		try {
			fs.writeFileSync(path.normalize(`${__dirname}/${setup.data.directory}/registeredUsers.json`), JSON.stringify(module.list, null, 2));
		} catch (e) {
			console.log(e)
			console.log("Failed to save user data");
		}
	};

	module.getLocation = function(user, cb, passthrough) {
		refresh.requestNewAccessToken('provider', user.refreshToken, function(err, accessToken, newRefreshToken) {
			module.updateRefreshToken(user.characterID, newRefreshToken);
			esi.characters(user.characterID, accessToken).location().then(function(locationResult) {
				cache.get([locationResult.solar_system_id], function(locationName) {
					cb({
						id: locationResult.solar_system_id,
						name: locationName.name
					}, passthrough)
				})
			})
		})
	}

	generateNewUser = function(refreshToken, characterDetails, masterAccount, associatedMasterAccount, cb) {
		var newUserTemplate = {
			characterID: characterDetails.CharacterID,
			name: characterDetails.CharacterName,
			scopes: characterDetails.Scopes,
			refreshToken: refreshToken,
			avatar: "http://image.eveonline.com/Character/" + characterDetails.CharacterID + "_128.jpg",
			role: "Member",
			roleNumeric: 0,
			registrationDate: new Date(),
			notes: "",
			ships: [],
			relatedChars: [],
			statistics: { sites: {} },
			notifications: []
		}
		module.list.push(newUserTemplate);
		cb(newUserTemplate);
		module.saveUserData();
	};

	return module;
}

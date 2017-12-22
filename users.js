const path = require('path');

module.exports = function (setup) {
	var module = {};
	module.list = [];
	module.createUsersVariable = function() {
		try {
			module.list = JSON.parse(fs.readFileSync(path.normalize(`${__dirname}/${setup.data.directory}/registeredUsers.json`)));
			console.log("Existing users found: " + module.list.length);
		} catch (e) {
			console.log("No users found.");
		}
		return module.list;
	};

	const fs = require('fs');

	//Create and manage users - Currently doing this via JSON and saving the object every now and then. TODO: MongoDB with mongoose maybe?
	module.findOrCreateUser = function(users, refreshToken, characterDetails, cb) {
		//Check if the user exists
		var userProfile = module.findAndReturnUser(characterDetails.CharacterID);
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
	};

	module.findAndReturnUser = function(checkID) {
		var userProfile = false;
		for (var i = 0; i < module.list.length; i++) {
			if (module.list[i].characterID === checkID) {
				userProfile = module.list[i];
				break;
			}
		}
		return userProfile;
	};

	module.saveUserData = function() {
		try {
			fs.writeFileSync(path.normalize(`${__dirname}/${setup.data.directory}/registeredUsers.json`), JSON.stringify(module.list, null, 2));
		} catch (e) {
			console.log(e)
			console.log("Failed to save user data");
		}
	}

	generateNewUser = function(refreshToken, characterDetails, masterAccount, associatedMasterAccount, cb) {
		var newUserTemplate = {
			characterID: characterDetails.CharacterID,
			name: characterDetails.CharacterName,
			scopes: characterDetails.Scopes,
			refreshToken: refreshToken,
			avatar: "http://image.eveonline.com/Character/" + characterDetails.CharacterID + "_128.jpg",
			role: "Member",
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

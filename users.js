const path = require('path');
const fs = require('fs');
const setup = require('./setup.js');
const refresh = require('passport-oauth2-refresh');
const esi = require('eve-swagger');
const cache = require('./cache.js')(setup);
const db = require('./dbhandler.js').db.collection('users');

module.exports = function (setup) {
	var module = {};

	module.updateUserSession = function(req, res, next) {
		if (typeof req.session.passport !== "undefined") {
			module.findAndReturnUser(req.session.passport.user.characterID, function(userData) {
				req.session.passport.user = userData;
				req.session.save(function(err) {
					if (err) console.log(err);
					next();
				})
			})
		} else {
			next();
		}
	}

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
		db.find({'characterID': checkID}).toArray(function(err, docs) {
			if (docs.length === 0) {
				cb(false)
			} else {
				cb(docs[0])
			}
		});
	};

	module.updateRefreshToken = function(checkID, token) {
		db.updateOne({'characterID': checkID}, { $set: {refreshToken: token}}, function(err, result) {
			if (err) console.log(err);
		})
	}

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
		db.insert(newUserTemplate, function(err, result) {
			if (err) console.log(err);
			cb(newUserTemplate);
		})
	};

	return module;
}

const path = require('path');
const fs = require('fs');
const setup = require('./setup.js');
const refresh = require('passport-oauth2-refresh');
const esi = require('eve-swagger');
const cache = require('./cache.js')(setup);
const db = require('./dbHandler.js').db.collection('users');
const log = require('./logger.js');

module.exports = function (setup) {
	var module = {};
	//This nested if stuff is kinda unpleasant and I'd like to fix it
	module.updateUserSession = function (req, res, next) {
		if (typeof req.session.passport === "undefined" || typeof req.session.passport.user === "undefined") {
			next();
			return;
		}
		module.findAndReturnUser(req.session.passport.user.characterID, function (userData) {
			req.session.passport.user = userData;
			req.session.save(function (err) {
				if (err) log.error("updateUserSession: Error for session.save", { err, 'characterID': user.characterID });
				next();
			})
		});
	}

	//Create and manage users - Currently doing this via JSON and saving the object every now and then. TODO: MongoDB with mongoose maybe?
	module.findOrCreateUser = function (users, refreshToken, characterDetails, cb) {
		//Check if the user exists
		module.findAndReturnUser(characterDetails.CharacterID, function (userProfile) {
			//We found the user, return it back to the callback
			if (userProfile) {
				log.debug(`Known user ${userProfile.name} has logged in.`);
				cb(userProfile);
			} else {
				//We didn't find the user, create them as a master account
				log.info(`Creating a new user for ${characterDetails.CharacterName}.`);
				generateNewUser(refreshToken, characterDetails, null, null, function (userProfile, err) {
					cb(userProfile, err);
				});
			}
		});
	};

	module.findAndReturnUser = function (checkID, cb) {
		db.find({ 'characterID': checkID }).toArray(function (err, docs) {
			if (err) log.error("findAndReturnUser: Error for db.find.toArray", { err, checkID });
			if (docs.length === 0) {
				cb(false)
			} else {
				cb(docs[0])
			}
		});
	};

	module.updateRefreshToken = function (checkID, token) {
		db.updateOne({ 'characterID': checkID }, { $set: { refreshToken: token } }, function (err, result) {
			if (err) log.error("updateRefreshToken: Error for updateOne", { err, 'characterID': checkID });
		})
	}

	module.getLocation = function (user, cb, passthrough) {
		module.findAndReturnUser(user.characterID, function (newUser) {
			if (Date.now() <= (newUser.location.lastCheck + 30000)) {
				cb(newUser.location, passthrough);
				return;
			}
			refresh.requestNewAccessToken('provider', user.refreshToken, function (err, accessToken, newRefreshToken) {
				if (err) log.error("getLocation: Error for requestNewAccessToken", { err, characterID: user.characterID });
				module.updateRefreshToken(user.characterID, newRefreshToken);
				esi.characters(user.characterID, accessToken).location().then(function (locationResult) {
					cache.get([locationResult.solar_system_id], function (locationName) {
						var location = {
							id: locationResult.solar_system_id,
							name: locationName.name,
							lastCheck: Date.now()
						};
						cb(location, passthrough);
						db.updateOne({ 'characterID': user.characterID }, { $set: { location: location } }, function (err, result) {
							if (err) log.error("getLocation: Error for db.updateOne", { err, 'characterID': user.characterID, location });
						});
					})
				}).catch(err => {
					log.error("users.getLocation: Error for esi.characters", { err, characterID: user.characterID });
				});
			})
		})
	}

	module.getUserDataFromID = function (id, cb) {
		esi.characters(id).info().then(function (data) {
			var allianceID = data.alliance_id || 0;
			var corporationID = data.corporation_id || 0;
			esi.corporations.names(corporationID).then(function (corporation) {
				if (allianceID !== 0) {
					esi.alliances.names(allianceID).then(function (alliance) {
						cb(alliance[0], corporation[0]);
					}).catch(err => {
						log.error("users.getUserDataFromID: Error for esi.alliances.names", { err, userId: id, allianceID });
					});
				} else {
					cb(null, corporation[0])
				}
			}).catch(err => {
				log.error("users.getUserDataFromID: Error for esi.corporations.names", { err, userId: id, corporationID });
			});
		}).catch(err => {
			log.error("users.getUserDataFromID: Error for esi.characters.info", { err, id });
		});

	}

	generateNewUser = function (refreshToken, characterDetails, masterAccount, associatedMasterAccount, cb) {
		module.getUserDataFromID(characterDetails.CharacterID, function (alliance, corporation) {
			if (alliance && setup.permissions.alliances.includes(alliance.name)) {
				log.debug(`${characterDetails.CharacterName} is in alliance ${alliance.name}`)
				var newUserTemplate = {
					characterID: characterDetails.CharacterID,
					name: characterDetails.CharacterName,
					scopes: characterDetails.Scopes,
					alliance: alliance,
					corporation: corporation,
					refreshToken: refreshToken,
					avatar: "https://image.eveonline.com/Character/" + characterDetails.CharacterID + "_128.jpg",
					role: "Member",
					roleNumeric: 0,
					registrationDate: new Date(),
					notes: "",
					ships: [],
					relatedChars: [],
					statistics: { sites: {} },
					notifications: [],
					location: { lastCheck: 0 }
				}
				db.insert(newUserTemplate, function (err, result) {
					if (err) log.error("generateNewUser: Error for db.insert", { err, name: characterDetails.CharacterName });
					cb(newUserTemplate);
				})
			} else {
				log.warn(`${characterDetails.CharacterName} is not in a whitelisted alliance (${alliance ? alliance.name : 'null'})`)
				cb(false, `${characterDetails.CharacterName} is not in a whitelisted alliance (${alliance ? alliance.name : 'null'})`);
			}
		})
	};

	return module;
}

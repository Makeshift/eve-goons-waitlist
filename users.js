const path = require('path');
const fs = require('fs');
const setup = require('./setup.js');
const bans = require('./bans.js')(setup)
const refresh = require('passport-oauth2-refresh');
const esi = require('eve-swagger');
const cache = require('./cache.js')(setup);
const db = require('./dbHandler.js').db.collection('users');
const log = require('./logger.js')(module);

module.exports = function (setup) {
	var module = {};
	//This nested if stuff is kinda unpleasant and I'd like to fix it
	module.updateUserSession = function (req, res, next) {
		if (typeof req.session.passport === "undefined" || typeof req.session.passport.user === "undefined") {
			next();
			return;
		}
		module.findAndReturnUser(req.session.passport.user.characterID, function (userData) {
			if (!userData) {
				req.logout();
				res.redirect('/');
				next();
			} else {
				req.session.passport.user = userData;
				req.session.save(function (err) {
					if (err) log.error("updateUserSession: Error for session.save", { err, 'characterID': user.characterID });
					
				})

				//check for ban
				bans.checkIfBanned(req.user.characterID, function(ban) {
					if (ban.banType == "Squad") {
						log.warn("Logging out banned user: " + req.user.name);
						req.logout();
						res.status(418).render("banned.html");
					} else {
						next();
					}
					return;
				});
			}
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

	module.deleteUser = function(checkID, cb) {
		db.deleteOne({'characterID': checkID}, function(err, results) {
			log.info("A user has been deleted: " + checkID);
			if (cb) cb();
		})
	}

	module.updateRefreshToken = function (checkID, token) {
		db.updateOne({ 'characterID': checkID }, { $set: { refreshToken: token } }, function (err, result) {
			if (err) log.error("updateRefreshToken: Error for updateOne", { err, 'characterID': checkID });
		})
	}


	//TODO: Use the cache for the systems
	module.getLocation = function (user, cb) {
		refresh.requestNewAccessToken('provider', user.refreshToken, function (err, accessToken, newRefreshToken) {
			if (err) {
				log.error("users.getLocation: Error for requestNewAccessToken", { err, user });
				cb(400, err);
			} else {
				module.updateRefreshToken(user.characterID, newRefreshToken);
				esi.characters(user.characterID, accessToken).location().then(function (locationResult) {
					esi.solarSystems(locationResult.solar_system_id).info().then(function(systemObject) { 
					//cache.get(locationResult.solar_system_id, function(systemObject){
						var location = {
							id: systemObject.system_id,
							name: systemObject.name,
							lastcheck: Date.now()
						}
						cb(location);
					}).catch(function(err) {
						log.error("users.getLocation: Error GET /universe/systems/{system_id}/", {err, user});
						cb({id: 0, name: "unknown", lastcheck: Date.now()});
					})
				}).catch(function(err) {
					log.error("users.getLocation: Error GET /characters/{character_id}/location/", {err, user});
					cb({id: 0, name: "unknown", lastcheck: Date.now()});
				})
			}
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
					role: "Member",
					roleNumeric: 0,
					registrationDate: new Date(),
					notes: "",
					ships: [],
					relatedChars: [],
					statistics: { sites: {} }
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

	//Return a list of all users with a permission higher than 0.
	module.getFCList = function(cb) {
		db.find( { roleNumeric: {$gt: 0}}).toArray(function (err, docs) {
			if (err) log.error("fleet.getFCPageList: Error for db.find", { err });
			cb(docs);
		})
	}

	//Update a users permission and title.
	module.updateUserPermission = function(characterID, permission, adminUser, cb) {
		//Stop a user from adjusting their own access.
		if(characterID !== adminUser.characterID)
		{
			db.updateOne({ 'characterID': characterID }, { $set: { roleNumeric: Number(permission), role: setup.userPermissions[permission]} }, function (err, result) {
				if (err) log.error("Error updating user permissions ", { err, 'characterID': characterID });
				if (!err) log.debug(adminUser.Name + " changed the role of " + characterID + " to " + setup.userPermissions[permission]);
			})
		}
	}

	//Set a users destination
	module.setDestination = function(user, systemID, cb) {
		refresh.requestNewAccessToken('provider', user.refreshToken, function (err, accessToken, newRefreshToken) {
			if (err) {
				log.error("module.setDestination: Error for requestNewAccessToken", { err, user });
				cb(err);
			} else {
				log.debug("Setting "+user.name+"\'s destination to "+systemID);
				esi.characters(user.characterID, accessToken).autopilot.destination(systemID).then(result => {
					cb("OK");
				}).catch(err => {
					log.error("users.setDestination: ", { err });
					cb(err);
				});
			}
		})
	}

	//Open the info window of an alliance, corporation or pilot.
	module.showInfo = function(user, targetID, cb) {
		refresh.requestNewAccessToken('provider', user.refreshToken, function (err, accessToken, newRefreshToken) {
			if (err) {
				log.error("module.showInfo: Error for requestNewAccessToken", { err, user });
				cb(err)
			} else {
				log.debug("Opening "+targetID+"\'s information window for "+user.name)
				esi.characters(user.characterID, accessToken).window.info(targetID).then(result => {
					cb("OK");
				}).catch(err => {
					log.error("users.showInfo: ", { err });
					cb(err)
				});
				
			}
		})
	}
	
	return module;
}
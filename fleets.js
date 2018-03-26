const fs = require('fs');
const path = require('path');
const esi = require('eve-swagger');
const refresh = require('passport-oauth2-refresh');
const setup = require('./setup.js');
const users = require('./users.js')(setup);
const cache = require('./cache.js')(setup);
const db = require('./dbHandler.js').db.collection('fleets');
const log = require('./logger.js');
var waitlist = require('./globalWaitlist.js')(setup);

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

	module.get = function (id, cb) {
		db.findOne({ 'id': id }, function (err, doc) {
			if (err) log.error("fleets.get: Error for db.findOne", { err, id });
			if (doc === null) {
				cb(null, false)
			} else {
				cb(doc, true);
			}

		});
	}

	module.getMembers = function (characterID, refreshToken, fleetid, fullDoc, cb) {
		refresh.requestNewAccessToken('provider', refreshToken, function (err, accessToken, newRefreshToken) {
			if (err) {
				log.error("fleets.getMembers: Error for requestNewAccessToken", { err, characterID });
				// TODO: is it good to throw?
				throw err;
			}
			users.updateRefreshToken(characterID, newRefreshToken);
			esi.characters(characterID, accessToken).fleet(fleetid).members().then(function (members) {
				cb(members, fleetid, fullDoc)
			}).catch(function (err) {
				log.error("fleets.getMembers: Error for esi.characters ", { err, characterID, fleetid });
				if (typeof cb === "function") {
					cb(null, fleetid, fullDoc);
				}
			})
		});
	}

	module.invite = function (fcid, refreshToken, fleetid, inviteeid, cb) {
		refresh.requestNewAccessToken('provider', refreshToken, function (err, accessToken, newRefreshToken) {
			if (err) {
				log.error("fleets.invite: Error for requestNewAccessToken", { err, fleetid, inviteeid });
				// TODO: is it good to throw?
				throw err;
			}
			users.updateRefreshToken(fcid, newRefreshToken);
			esi.characters(fcid, accessToken).fleet(fleetid).invite({ "character_id": inviteeid, "role": "squad_member" });
			if (typeof cb === "function") {
				cb();
			}
		})
	}

	module.register = function (data, cb) {
		module.get(data.id, function (fleets, fleetCheck) {
			if (!fleetCheck) {
				db.insert(data, function (err, result) {
					if (err) log.error("fleet.register: Error for db.insert", { err, id: data.id });
					cb(true);
				});
			} else {
				cb(false, "This fleet ID has already been registered. Are you trying to register the same fleet twice?");
			}
		});
	}

	module.getFCPageList = function (cb) {
		db.find({}).toArray(function (err, docs) {
			if (err) log.error("fleet.getFCPageList: Error for db.find", { err });
			cb(docs);
		})
	}

	module.delete = function (id, cb) {
		if (setup.permissions.devfleets && setup.permissions.devfleets.includes(id)) {
			log.debug("Special dev fleet, not deleting", { id });
			if (typeof cb === "function") cb();
			return;
		}
		db.deleteOne({ 'id': id }, function (err, result) {
			if (err) log.error("fleet.delete: Error for db.deleteOne", { err, id });
			if (typeof cb === "function") cb();
		})
	}

	module.checkForDuplicates = function () {
		db.find({}).toArray(function (err, docs) {
			if (err) log.error("fleet.checkForDuplicates: Error for db.find", { err });
			var members = [];
			//Concat didn't work here for some reason? Weird for loop madness instead
			for (var i = 0; i < docs.length; i++) {
				for (var x = 0; x < docs[i].members.length; x++) {
					members.push(docs[i].members[x].character_id);
				}
			}
			waitlist.get(function (onWaitlist) {
				for (var i = 0; i < onWaitlist.length; i++) {
					var charID = onWaitlist[i].user.characterID;
					var charName = onWaitlist[i].user.name;
					if (onWaitlist[i].alt) {
						charID = onWaitlist[i].alt.id;
						charName = onWaitlist[i].alt.name;
					}
					if (members.includes(charID)) {
						log.debug(`Character ${charName} found in fleet and removed from waitlist.`);
						waitlist.remove(onWaitlist[i]._id);
					}
				}
			})
		})
	}
	
	module.updateFC = function(fleetid, user, cb) {
		db.updateOne({'id': fleetid}, {$set: {fc: user}}, function(err, result) {
			if (err) log.error("Error setting a new FC", err);
			if (!err) log.debug("New FC set: "+user.name);
			if (typeof cb === "function") cb();
		});
	}

	module.updateBackseat = function(fleetid, user, cb) {
		
		module.get(fleetid, function(fleet) {
		  if (user.characterID !== fleet.backseat.characterID && user.characterID !== fleet.fc.characterID) {//user.id !== fleet.backseat.characterID && user.id !== fleet.fc.characterID
			db.updateOne({'id': fleetid}, {$set: {backseat: user}}, function(err, result) {
			  if (err) log.error("Error setting a new backseat", err);
			  if (!err) log.debug("New backseat set: "+user.name);
			  if (typeof cb === "function") cb();
			});
		  } else {
			db.updateOne({'id': fleetid}, {$set: {backseat: {}}}, function(err, result) {
			  if (err) log.error("Error clearing the backseat", err);
			  if (!err) log.debug("Backseat cleared");
			  if (typeof cb === "function") cb();
			});
		  }
		})
	}
	
	module.updateComms = function(fleetid, comms, cb) {
		db.updateOne({'id': fleetid}, {$set: {comms: comms}}, function(err, result) {
			if (err) log.error("fleet.updateComms: Error for db.updateOne", { err, fleetid });
			if (typeof cb === "function") cb();
		});
	}

	module.updateType = function (fleetid, type, cb) {
		db.updateOne({ 'id': fleetid }, { $set: { type: type } }, function (err, result) {
			if (err) log.error("fleet.updateType: Error for db.updateOne", { err, fleetid });
			if (typeof cb === "function") cb();
		})
	}

	module.updateStatus = function (fleetid, status, cb) {
		db.updateOne({ 'id': fleetid }, { $set: { status: status } }, function (err, result) {
			if (err) log.error("fleet.updateStatus: Error for db.updateOne", { err, fleetid });
			if (typeof cb === "function") cb();
		})
	}


	module.timers = function () {
		//TODO: Replace this with a proper fleet lookup method that uses the expiry and checks for errors
		//TODO: Error checking doesn't work due to how ESI module handles errors
		setTimeout(lookup, 10*1000)

		function lookup() {
			var checkCache = [];
			db.find().forEach(function (doc) {
				module.getMembers(doc.fc.characterID, doc.fc.refreshToken, doc.id, doc, function (members, fleetid, fullDoc) {
					if (members == null) {
						fleetHasErrored();
					} else {
						db.updateOne({ 'id': fleetid }, { $set: { "members": members, "errors": 0 } }, function (err, result) {
							if (err) log.error("fleet.timers: Error for db.updateOne", { err, fleetid });
							module.checkForDuplicates();
						});
						//Won't work because we can't hit the endpoint anymore, oops
						members.forEach(function (member, i) {
							if (member.role.includes("boss")) {
								updateFleetCommander(member, fullDoc.id);
							}
							checkCache.push(member.ship_type_id);
							checkCache.push(member.solar_system_id);
							if (i == members.length - 1) {
								cache.massQuery(checkCache);
							}
						});
					}

					function fleetHasErrored() {
						if (doc.errors < 5) {
							log.warn(`Fleet under ${fullDoc.fc.name} caused an error.`);
							db.updateOne({ 'id': fleetid }, { $set: { "errors": fullDoc.errors + 1 || 1 } });
						} else {
							log.warn(`Fleet under ${fullDoc.fc.name} was deleted due to errors.`);
							module.delete(fleetid);
						}
					}

					function updateFleetCommander(member, fleetid) {
						users.findAndReturnUser(member.character_id, function (user) {
							db.updateOne({ 'id': fleetid }, { $set: { fc: user } }, function (err, result) {
								if (err) log.error("updateFleetCommander: Error for db.updateOne", { err, fleetid });
							})
						});
					}
				});
			})
			module.timers();
		}

	}


	return module;
}
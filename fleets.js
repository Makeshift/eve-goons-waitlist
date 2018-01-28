const fs = require('fs');
const path = require('path');
const esi = require('eve-swagger');
const refresh = require('passport-oauth2-refresh');
const setup = require('./setup.js');
const users = require('./users.js')(setup);
const cache = require('./cache.js')(setup);
const db = require('./dbhandler.js').db.collection('fleets');

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

	module.get = function(id, cb) {
		db.findOne({'id': id}, function(err, doc) {
			if (err) console.log(err);
			if (doc === null) {
				cb(null, false)
			} else {
				cb(doc, true);
			}

		});
	}

	module.getMembers = function(characterID, refreshToken, fleetid, cb) {
		refresh.requestNewAccessToken('provider', refreshToken, function(err, accessToken, newRefreshToken) {
			if (err) throw err;
			users.updateRefreshToken(characterID, newRefreshToken);
			esi.characters(characterID, accessToken).fleet(fleetid).members().then(function(members) {
				cb(members, fleetid)
			});
		});
	}

	module.register = function(data, cb) {
			module.get(data.id, function(fleets, fleetCheck) {
				if (!fleetCheck) {
					db.insert(data, function(err, result) {
						if (err) console.log(err);
						cb(true);
					});
				} else {
					cb(false, "This fleet ID has already been registered. Are you trying to register the same fleet twice?");
				}
			});
	}

	module.getFCPageList = function(cb) {
		db.find({}).toArray(function(err, docs) {
			if (err) console.log(err);
			cb(docs);
		})
	}

	module.delete = function(id, cb) {
		db.deleteOne({ 'id': id }, function(err, result) {
			if (err) console.log(err);
			cb();
		})
	}


	module.timers = function() {	
		//TODO: Replace this with a proper fleet lookup method that uses the expiry and checks for errors
		setTimeout(function() {
				var checkCache = [];
					db.find().forEach(function(doc) {
						if (doc.errors < 5) {
							try {
								module.getMembers(doc.fc.characterID, doc.fc.refreshToken, doc.id, function(members, fleetid) {
									db.updateOne({ 'id' : fleetid }, { $set: { "members": members, "errors": 0 }}, function(err, result) {
										if (err) console.log(err);
									})
									members.forEach(function(member, i) {
										checkCache.push(member.ship_type_id);
										checkCache.push(member.solar_system_id);
										if (i == members.length-1) {
											cache.massQuery(checkCache);
										}
									})
								})
							} catch(e) {
								console.log("Fleet under " + doc.fc.name + " caused an error.")
								db.updateOne({ 'id': doc.id}, { $set: { "errors": doc.errors+1 || 1 }})
							}
						} else {
							module.delete(doc.id, function() {
								console.log("Fleet under " + doc.fc.name + " deleted due to errors.");
							})
						}
					})
			module.timers();
		}, 10000)

	}


	return module;
}
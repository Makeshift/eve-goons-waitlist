const setup = require('../setup.js');
const refresh = require('passport-oauth2-refresh');
const esi = require('eve-swagger');
const cache = require('../cache.js')(setup);
const db = require('../dbHandler.js').db.collection('users');
const log = require('../logger.js')(module);

module.exports = function() {
	/*
	* Return a location object {systemID, name} using ESI and cache
    * @params: {user}
    * @return: location{system_id, system_name}
    */
    module.getLocation = function (user, cb) {
		module.getRefreshToken(user.characterID, function(accessToken){
			if(!!!accessToken){
				log.warn("user.getLocation: Could not get an accessToken", {pilot: user.name})
				cb({id: 0, name: "unknown", lastcheck: Date.now()});
				return;
			}
			esi.characters(user.characterID, accessToken).location().then(function (locationResult) {
				cache.get(locationResult.solar_system_id, null, function(systemObject){
					var location = {
						systemID: systemObject.id,
						name: systemObject.name,
					}
					cb(location);
				})
			}).catch(function(err) {
				log.error("user.getLocation: Error GET /characters/{character_id}/location/", {pilot: user.name, err});
				cb({id: 0, name: "unknown", lastcheck: Date.now()});
			})
		}) 
	}

	/*
	* Checks to see if the user is online
	* @params characterID
	* @return bool
	*/
	module.isOnline = function(characterID, online){
		module.getRefreshToken(characterID, function(accessToken){
			esi.characters(characterID, accessToken).online().then(function(isOnline){
				online(isOnline);
			})
		}).catch(function(err){
			console.error("user.isOnline: error getting refresh token", {characterID: characterID, err});
			online(null);
		})
	}

	/*
    * @params: {user}
    * @return: location{system_id, system_name}
    * @todo: Use the cache for the systems 
    */
	module.getRefreshToken = function(characterID, tokenCallback){
		db.findOne({characterID: characterID}, function(err, doc){
			refresh.requestNewAccessToken('provider', doc.refreshToken, function(error, accessToken, newRefreshToken){
				if(error){
					log.error("user.getRefreshToken - requestNewAccessToken: ", {pilot: characterID, error});
					tokenCallback(null);
					return;
				}

				db.updateOne({ 'characterID': characterID }, { $set: { refreshToken: newRefreshToken } }, function (err, result) {
					if (err) log.error("user.getRefreshToken: Error for updateOne", { err, 'characterID': characterID });
					tokenCallback(accessToken);
					return;
				})
			});
		})
	}

    /*
    * @params: {user}, system_id, system_name
    * @return: cb(status)
    */
	module.setDestination = function(user, systemID, cb) {
		module.getRefreshToken(user.characterID, function(accessToken){
			esi.characters(user.characterID, accessToken).autopilot.destination(systemID).then(result => {
				cb("OK");
			});
		})	
    }
    
    /*
    * @params: {user}, target_id
    * @return: cb(status)
    */
	module.showInfo = function(user, targetID, cb) {
		module.getRefreshToken(user.characterID, function(accessToken){	
			esi.characters(user.characterID, accessToken).window.info(targetID).then(result => {
				cb("OK");
			}).catch(err => {
				log.error("user.showInfo: ", { err });
				cb(err)
			});
		})
	}

    /*
    * @params: {user}, target_id
    * @return: cb(status)
    */
	module.openMarketWindow = function(user, targetID, cb) {
		module.getRefreshToken(user.characterID, function(accessToken){
			esi.characters(user.characterID, accessToken).window.market(targetID).then(result => {
				cb("OK");
			}).catch(err => {
				log.error("user.openMarketWindow: ", { err });
				cb(err)
			});	
		})
	}	

	/*
	* Invert the sideBar setting
	* @params user{}
	* @retunr status
	*/
	module.sideNav = function(user, cb){
		let sideNav = (user.settings != undefined)? user.settings.smSideNav : true;
		//Update the main account so that the settings propagate down
		db.updateOne({characterID: (user.account.main)?user.characterID : user.account.mainID},{$set: {"settings.smSideNav": !sideNav}}, function (err, result) {
			if(!err){
				cb(200);
			} else {
				log.error("user.sideNav - ", {user: user.name, err});
				cb(400);
			}
		})
	}

	/*
	* Sets a flag that will log the user out on the next HTTP request
	* @params user{}
	* @retunr status
	*/
	module.logOut = function(targetID, user, cb){
		db.updateOne({characterID: Number(targetID)},{$set: {"logout": user.name}}, function (err, result) {
			if(!err){
				cb(200);
			} else {
				log.error("user.logOut - ", {target: targetID, admin: user.name, err});
				cb(400);
			}
		})
	}
	
	/*
	* Sets a new title for the user
	* @params user{}
	* @retunr status
	*/
	module.setTitle = function(targetID, title, cb){
		db.updateOne({characterID: Number(targetID)},{$set: {"role.title": title}}, function (err, result) {
			if(!err){
				cb(200);
			} else {
				log.error("user.setTitle - ", {target: targetID, err});
				cb(400);
			}
		})
	}

	/*
	* Sets the users waitlist main. Should auto clear by downtime
	* @params characterID (int)
	* @return null || err
	*/
	module.setWaitlistMain = function(characterID, waitlistMain, cb){
		db.updateOne({characterID: Number(characterID)}, {$set: {waitlistMain: waitlistMain}}, function (err) {
			if(!err){
				cb(null);
			} else {
				log.error("user.setWaitlistMain - ", {"user ID": characterID, err});
				cb(err);
			}
		})
	}

	/*
	* Updates the users jabbername. 
	* @function will @goonfleet.com
	* @params characterID (int), jabberName
	* @return status
	*/
	module.updateJabber = function(characterID, jabberName, cb){
		let charPos = jabberName.indexOf("@")
		jabberName = jabberName.substr(0, (charPos != -1)? charPos: jabberName.length);
		
		db.updateOne({characterID: characterID}, {$set: {"settings.xmpp": jabberName}},function(err){
			if(err) cb(400);
			if(!err) cb(200);
		})
	}


	module.addNote = function(characterID, message, disciplinary, admin, cb){
		let newNote = {
			"date": new Date(),
			"author": {
				"characterID": admin.characterID,
				"name": admin.name
			},
			"message": message,
			"isDisciplinary": disciplinary
		}
		db.updateOne({characterID: characterID}, {$push: {notes: newNote}}, function(err){
			if(!err){
				cb(200);
				return;
			}
			log.error("user.addNote: ", {"Character ID": characterID, "Admin Name": admin.name, message});
			cb(400);
			return;
		})
	}
    return module;
}
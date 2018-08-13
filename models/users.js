const setup = require('../setup.js');
const cache = require('../cache.js')(setup);
const esi = require('eve-swagger');
const db = require('../dbHandler.js').db.collection('users');
const log = require('../logger.js')(module);
const userO = require('./user.js')(setup);
const day = 86400;//Day in seconds

module.exports = function (setup) {
	var module = {};
	
	//Create and manage users
	module.findOrCreateUser = function (users, refreshToken, characterDetails, cb) {
		//Update the users refresh token
		if(refreshToken){
			db.updateOne({characterID: characterDetails.CharacterID}, {$set: {refreshToken: refreshToken}}, function(err, result){
				console.info("users.findOrCreateUser: Updating refreshToken for " + characterDetails.CharacterName);
			})
		}//Check if the user exists
		module.findAndReturnUser(characterDetails.CharacterID, function (userProfile) {
			//We found the user, return it back to the callback
			if (userProfile) {
				cb(userProfile);
			} else {
				//We didn't find the user, create them as a master account
				log.info(`Creating a new user for ${characterDetails.CharacterName}.`);
				module.generateNewUser(refreshToken, characterDetails, function (userProfile, err) {
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


	/*
	* Get the corporation and alliance of a pilot
	* @params characterID
	* @return cb(alliance{}, corp{})
	*/
	module.getPilotAffiliation = function (id, cb) {
		esi.characters(id).info().then(function (data) {
			var allianceID = data.alliance_id || 0;
	
			//Get Corporation Info
			cache.get(data.corporation_id, day, function(corporation){
				var corporation = {"corporationID": corporation.id, "name": corporation.name};
				
				//Return null if pilot isn't in an alliance
				if(allianceID == 0){
					cb(null, corporation);
					return;
				}
				
				//Get Alliance Info
				cache.get(allianceID, day, function(alliance){
					var alliance = {"allianceID": alliance.id, "name": alliance.name};
					
					cb(alliance, corporation);
				})
			})
		}).catch(err => {
			log.error("users.getPilotAffiliation: Error for esi.characters.info", { err, id });
		});
	}

	module.generateNewUser = function (refreshToken, characterDetails, cb) {
		module.getPilotAffiliation(characterDetails.CharacterID, function (alliance, corporation) {
			var newUserTemplate = {
				characterID: characterDetails.CharacterID,
				name: characterDetails.CharacterName,
				alliance: alliance,
				corporation: corporation,
				role: {
					"title": setup.userPermissions[0],
					"numeric": 0
				},
				notes: [],
				statistics: { sites: {} },
				account: { main: true, linkedCharIDs: []},
				settings: {smSideNav: false},
				refreshToken: refreshToken,
				registrationDate: new Date(),
				userVersion: 2
			}
			db.insert(newUserTemplate, function (err, result) {
				if (err) log.error("generateNewUser: Error for db.insert", { err, name: characterDetails.CharacterName });
				cb(newUserTemplate);
			})
		})
	};

	//Return a list of all users with a permission higher than 0.
	module.getFCList = function(cb) {
		db.find( { "role.numeric": {$gt: 0}}).toArray(function (err, docs) {
			if (err) log.error("fleet.getFCPageList: Error for db.find", { err });
			cb(docs);
		})
	}

	/*
	* Change the permission of a user
	* @params user{}, permission (int), admin{}
	* @return null
	*/
	//Update a users permission and title.
	module.updateUserPermission = function(user, permission, adminUser, cb) {
		//Stop a user from adjusting their own access.
		if(user.characterID !== adminUser.characterID)
		{
			db.updateOne({ 'characterID': user.characterID }, { $set: { "role.numeric": Number(permission), "role.title": setup.userPermissions[permission]} }, function (err) {
				if (err) log.error("Error updating user permissions ", { err, 'characterID': user.character });
				if (!err) log.debug(adminUser.name + " changed the role of " + user.name + " to " + setup.userPermissions[permission]);
				cb();
			})
		}
	}

	/*
	* Link the  alt account to the users master account.
	* @params: user{}, alt{}
	*/
	module.linkPilots = function(user, alt, status){
		module.findOrCreateUser(null, alt.refreshToken, alt, function(AltUser){
			//If the alt belongs to someone - abort.
			if(AltUser.account != null && !AltUser.account.main) {
				status({"type": "error", "message": "This alt already belongs to someone, think this is an error? Contact leadership."});
				return;
			}
			//Stop a main account from linking to itself
			if(user.characterID == AltUser.characterID){
				status({"type": "error", "message": "Error, you cannot link your main to itself."});
				return;
			}
			//Stop the user from linking a pilot that is a main with alts to another account.
			if(AltUser.account.main && AltUser.account.linkedCharIDs.length > 0){
				status({"type": "error", "message": "Error, you cannot link " + AltUser.name + " to your account as it's already a master account. To link these accounts, logout and into " + AltUser.name + " and then add this pilot as an alt."});
				return;
			}

			//Remove master account fields, set main to false and associate to a master account
			var account = {"main": false, "mainID": (user.account.main)? user.characterID: user.account.mainID};
			db.updateOne({ 'characterID': AltUser.characterID }, { $unset: {role:1, notes:1, ships:1, statistics:1}, $set: { account: account}}, function (err) {
				if(err) console.log("users.linkPilots - error updating alt account: ", err);
				if(!err){
					db.updateOne({'characterID': account.mainID}, {$push: {"account.linkedCharIDs": AltUser.characterID}}, function(err) {
						if(err) console.log("users.linkPilots - error updating main account: ", err);
					})
				}
				
			})

			status({"type": "success", "message": alt.CharacterName + " has been added to your account as an alt."});			
		})
	}

	/*
	* Link userID (int).
	* @params: users main{}
	*/
	module.getMain = function(userID, mainPilot){
		db.findOne({"characterID": userID}).then(function(userObject){
			//No user detected
			if(!userObject)
			{
				mainPilot(null);
				return;
			}

			//User is main
			if(userObject.account.main){
				mainPilot(userObject);
				return;
			}

			//Lookup and return master account
			db.findOne({"characterID": Number(userObject.account.mainID)}).then(function(userObject){
				mainPilot(userObject);
			})
		});
	}

	/*
	* Return an array of linked characters.
	* @params: userID (int)
	* @return: returnCharacters[ {characterID, name} ]
	*/
	module.getAlts = function(userID, returnCharacters){
		let knownPilots = [];
		module.getMain(userID, function(mainObject){
            if(!mainObject) {
                returnCharacters([]);
                return;
            } 

			knownPilots.push({"characterID": mainObject.characterID, "name": mainObject.name});
			
			db.find(
				{
					characterID: {
						$in: mainObject.account.linkedCharIDs
					}
				}
			).toArray(function(err, altObjects) {
				var xformed = altObjects.map( item => {
					return { "characterID": item.characterID, "name": item.name };
				});
				knownPilots = knownPilots.concat(xformed);
				returnCharacters(knownPilots);
			});
		})
	}

	/*
	* Return an array of linked characters.
	* @params: user{}, (int)
	* @return: bool
	*/
	module.isRoleNumeric = function(user, atLeast){
		return !!user && !!user.role && user.role.numeric >= atLeast;
	}

	//Calculates the skills table for a pilot and passes it back to the controler so it can render in the view.
	//TODO: Skill System: move out of this file and make it clean check issue: 120
	module.checkSkills = function(user, skillsPackage, cb) {
		userO.getRefreshToken(user.characterID, function(accessToken){
			esi.characters(user.characterID, accessToken).skills().then(result => {
				//Create ESI Skills Array
				var esiSkills = [];
				for(var i = 0; i < result.skills.length; i++) {
					esiSkills[result.skills[i].skill_id] = result.skills[i];
				}
				
				//Calc General Skills
				skillsPackage.generalSkills.txtclass = "text-success";
				skillsPackage.generalSkills.txticon = `<i class="fa fa-check-circle"></i>`;
				var cSkillSet = skillsPackage.generalSkills;				
				for(var i = 0; i < cSkillSet.length; i++) {
					cSkillSet[i].actual = (esiSkills[cSkillSet[i].id])? esiSkills[cSkillSet[i].id].current_skill_level : 0;
					//did skill fail?
					if(cSkillSet[i].actual < cSkillSet[i].required && cSkillSet[i].failable == true) {
						cSkillSet[i].class = "skills-failed";
						//Set Menu Fail Indicator
						skillsPackage.generalSkills.txtclass = "text-danger";
						skillsPackage.generalSkills.txticon = `<i class="fa fa-times-circle"></i>`;
					} else {
						cSkillSet[i].class = "skills-pass";
					}
				}
				skillsPackage.generalSkills = cSkillSet;


				//skill categories
				for(var c = 0; c < skillsPackage.categories.length; c++) {
					skillsPackage.categories[c].txtclass = "text-success";
					skillsPackage.categories[c].txticon = `<i class="fa fa-check-circle"></i>`;
					var cSkillSet = skillsPackage.categories[c].Skills;			
					for(var i = 0; i < cSkillSet.length; i++) {
						cSkillSet[i].actual = (esiSkills[cSkillSet[i].id])? esiSkills[cSkillSet[i].id].current_skill_level : 0;
						//did skill fail?
						if(cSkillSet[i].actual < cSkillSet[i].required && cSkillSet[i].failable == true) {
							cSkillSet[i].class = "skills-failed";
							skillsPackage.categories[c].txtclass = "text-danger";
							skillsPackage.categories[c].txticon = `<i class="fa fa-times-circle"></i>`;
						} else {
							cSkillSet[i].class = "skills-pass";
						}
						
					}
					skillsPackage.categories[c].Skills = cSkillSet;
				}			
				//Return the skills package for the view
				skillsPackage.totalSP = result.total_sp;
				cb(skillsPackage);
			}).catch(err => {
				log.error("users.checkSkills: ", { err });
				cb(err)
			});
		})
	}

	return module;
}
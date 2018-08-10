const setup = require('../setup.js');
const log = require('../logger.js')(module);
const users = require('../models/users.js')(setup);

module.exports = function (setup) {
	var module = {};
	//This nested if stuff is kinda unpleasant and I'd like to fix it
	//TODO: Make middleware for session, isBanned? isWhitelisted?
	module.refresh = function (req, res, next) {
		if (!req.session.passport || !req.session.passport.user) {
            console.log("smaller fuck. but still. WTF MAN?");
			res.render("statics/login.html");
			return;
		}
		users.findAndReturnUser(req.session.passport.user.characterID, function (userData) {
			if (!userData) {
                console.log("WHAT THE ACTUAL FUCK!!!@#!#$!$@@$!@$!@$!");
				req.logout();
				res.render("statics/login.html");
				next();
			} else {
				
				users.getMain(userData.characterID, function(mainUserData){
					users.getAlts(mainUserData.characterID, function(pilotArray){
						userData.role = mainUserData.role;
						userData.account.pilots = pilotArray.sort(function(a,b) {
							if(a.name > b.name) return 1;
							return -1;
						});
						userData.settings = mainUserData.settings;
						userData.waitlistMain = mainUserData.waitlistMain;
						req.session.passport.user = userData;
						req.session.save(function (err) {
							if (err) log.error("updateUserSession: Error for session.save", { err, 'characterID': user.characterID });
							next();
						})	
					})//End Session Change
				})
			}
		});
	}

	return module;
}
const setup = require('../setup.js');
const log = require('../logger.js')(module);
const users = require('../models/users.js')(setup);

module.exports = function (setup) {
	var module = {};
	//This nested if stuff is kinda unpleasant and I'd like to fix it
	//TODO: Make middleware for session, isBanned? isWhitelisted?
	module.refresh = function (req, res, next) {
		if (typeof req.session.passport === "undefined" || typeof req.session.passport.user === "undefined") {
			next();
			return;
		}
		users.findAndReturnUser(req.session.passport.user.characterID, function (userData) {
			if (!userData) {
				req.logout();
				res.render("statics/login.html");
				next();
			} else {
				
				users.getMain(userData.characterID, function(mainUserData){
					users.getAlts(mainUserData.characterID, function(pilotArray){
						userData.role = mainUserData.role;
						userData.account.pilots = pilotArray;
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
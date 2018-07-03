const setup = require('../setup.js');
const bans = require('../models/bans.js')(setup)
const log = require('../logger.js')(module);

/* Block access for banned users */
module.exports = function (setup) {
	var module = {};

	module.check = function (req, res, next) {
		if(!req.isAuthenticated()){
			next();
			return;
		}
		
		bans.checkIfBanned(req.user.characterID, function(ban) {
			if (ban.banType == "Squad") {
				log.warn("Logging out banned user: " + req.user.name);
				req.logout();
				res.status(418).render("statics/banned.html");
				return;
			}
			next();
		})
	}

	return module;
}
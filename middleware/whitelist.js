const setup = require('../setup.js');
const log = require('../logger.js')(module);
const whitelist = require('../models/whitelist.js')(setup);

/* Only allow whitelisted users access */
module.exports = function (setup) {
	var module = {};

	module.check = function (req, res, next) {
		if(!req.isAuthenticated()){
			next();
			return;
		}
        
		let alliance = (req.user.alliance) ? req.user.allianceID : null;
		whitelist.isAllowed(req.user, req.user.corporation.corporationID, alliance, function(whitelisted){
			if(whitelisted){
				next();
				return;
			} 

			log.warn("User is not whitelisted");
			req.logout();
			res.status(401).render("statics/notAllowed.html");
		})
	}

	return module;
}
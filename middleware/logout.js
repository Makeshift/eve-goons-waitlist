const db = require('../dbHandler.js').db.collection('users');
const log = require('../logger')(module);

/* Check to see if the user was flagged for logout */
module.exports = function (setup) {
	var module = {};
    
    module.check = function (req, res, next) {
		if(!req.isAuthenticated()){
			next();
			return;
		}
        
		if(req.user.logout){
            db.updateOne({characterID: Number(req.user.characterID)}, {$unset: {"logout": 1}}, function(err, result){
                if(err) {
                    log.warn("logout middleware: unable to unset logout flag - ", err);
                }

                log.info(req.user.name + " has been flagged for logout.");
                req.logout();
                res.status(401).render("statics/login.html");
                next();
                return;
            })
        }
        next();
    }
    
	return module;
}
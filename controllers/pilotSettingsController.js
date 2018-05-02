var path = require('path');
var setup = require('../setup.js');
var bans = require('../bans.js')(setup);
var esi = require('eve-swagger');
const log = require('../logger.js')(module);

//Render Pilot Settings Page
exports.index = function(req, res) {
    if (req.isAuthenticated()) {
        
            var userProfile = req.user;
            var sideBarSelected = 2;
            res.render('pilotSettings.njk', {userProfile, sideBarSelected});

    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised", "message":"You need to be logged in to access this page."});
        res.status(403).redirect("/");
    }
}
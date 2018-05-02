var path = require('path');
var setup = require('../setup.js');
var users = require('../users.js')(setup);
var refresh = require('passport-oauth2-refresh');
const log = require('../logger.js')(module);

exports.fitTool = function(req, res) { 
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
            var userProfile = req.user;
            var sideBarSelected = 6;
            res.render('toolsFits.njk', {userProfile, sideBarSelected});
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}

exports.waitlistLog = function(req, res) {
    res.send("Log of waitlist invites/removals");
}
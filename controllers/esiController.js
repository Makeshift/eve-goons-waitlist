var template = require('../template.js');
var path = require('path');
var setup = require('../setup.js');
var fleets = require('../fleets.js')(setup);
var users = require('../users.js')(setup);
var refresh = require('passport-oauth2-refresh');
var waitlist = require('../globalWaitlist.js')(setup);
const log = require('../logger.js')(module);

exports.waypoint = function(req, res) {
    if (req.isAuthenticated() && typeof req.params.systemID !== "undefined") {
        users.setDestination(req.user, req.params.systemID);
    }
    res.redirect('back');
}

exports.showInfo = function(req, res) {
    if (req.isAuthenticated && typeof req.params.targetID !== "undefined") {
        users.showInfo(req.user, req.params.targetID);
    }
    res.redirect('back');
}
var template = require('../template.js');
var path = require('path');
var setup = require('../setup.js');
var bans = require('../bans.js')(setup);
var fleets = require('../fleets.js')(setup);
var users = require('../users.js')(setup);
var esi = require('eve-swagger');
var refresh = require('passport-oauth2-refresh');
var cache = require('../cache.js')(setup);
var waitlist = require('../globalWaitlist.js')(setup);
const log = require('../logger.js')(module);

//Return the FC management page
exports.index = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 4) {
        var userProfile = {};
        if (typeof req.query.user != "undefined") {
            users.findAndReturnUser(Number(req.query.user), function(profile) {
                userProfile = profile;
                genPage();
            })
        } else {
            userProfile = req.user;
            genPage();
        }
        
        function genPage() {

            users.getFCList(function(fcList) {
                var userProfile = req.user;
                var sideBarSelected = 7;
                var fcs = fcList;
                var manageUser = userProfile
                res.render('adminFC.njk', {userProfile, sideBarSelected, fcs, manageUser});	
            });
        }
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 4? <br><br><a href='/'>Go back</a>");
    }
}

//Updates a users permission level.
exports.updateUser = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 4) {
        esi.characters.search.strict(req.body.pilotName).then(function (results) {
            users.updateUserPermission(results[0], req.body.permission, req.user, res)
            {
                res.redirect('/admin/commanders');
            }
        }).catch(function (err) {
            log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
            res.redirect(`/?err=Some error happened! Does that character exist? (DEBUG: || ${err.toString().split("\n")[0]} || ${err.toString().split("\n")[1]} || < Show this to Makeshift!`);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 4? <br><br><a href='/'>Go back</a>");
    }
}
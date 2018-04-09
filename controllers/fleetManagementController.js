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

//Open a Fleet Management Waitlist page.
exports.index = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.get(req.params.fleetid, function (fleet) {
            if (!fleet) {
                res.status(403).send("Fleet was deleted<br><br><a href='/'>Go back</a>");
                return;
            }

            var page = {
                template: "fcFleetManage",
                sidebar: {
                    selected: 5,
                    user: req.user
                },
                header: {
                    user: req.user
                },
                content: {
                    user: req.user,
                    fleet: fleet
                }
            }
            template.pageGenerate(page, function (generatedPage) {
                res.send(generatedPage);
            })				
            /*
            waitlist.get(function(usersOnWaitlist) {
                var userProfile = req.user;
                var sideBarSelected = 5;
                //console.log(usersOnWaitlist);
                res.render('fcFleetManage.njk', {userProfile, sideBarSelected, fleet, usersOnWaitlist});
            })*/
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Invite a pilot to a specific fleet
exports.invitePilot = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.get(req.params.fleetid, function (fleet) {
            fleets.invite(fleet.fc.characterID, fleet.fc.refreshToken, fleet.id, req.params.characterID, function () {
                res.redirect(302, '/commander/' + req.params.fleetid);
            });
            waitlist.setAsInvited(req.params.tableID);
        })

    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Remove a specific pilot from the waitlist
exports.removePilot = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        waitlist.remove(req.params.tableID, function () {
            res.redirect(302, '/commander/' + req.params.fleetid);
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update fleet comms.
exports.updateComms = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.updateComms(req.params.fleetid, { name: req.body.name, url: req.body.url }, function () {
            res.redirect('/commander/' + req.params.fleetid);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update fleet type
exports.updateType = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.updateType(req.params.fleetid, req.body.type, function () {
            res.redirect('/commander/' + req.params.fleetid);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update the Fleet Status
exports.updateStatus = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.updateStatus(req.params.fleetid, req.body.status, function () {
            res.redirect('/commander/' + req.params.fleetid);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update the Fleet Commander
exports.updateCommander = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.updateFC(req.params.fleetid, req.user, function() {
            res.redirect('/commander/'+req.params.fleetid);
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update the Backseat
exports.updateBackseat = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.updateBackseat(req.params.fleetid, req.user, function() {
            res.redirect('/commander/'+req.params.fleetid);
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Close the fleet
exports.closeFleet = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.delete(req.params.fleetid, function () {
            res.redirect('/commander/');
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}
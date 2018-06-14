const path = require('path');
const setup = require('../setup.js');
const fleets = require('../fleets.js')(setup);
const user = require('../user.js')(setup);
const users = require('../users.js')(setup);
const refresh = require('passport-oauth2-refresh');
const log = require('../logger.js')(module);


//Render FC Dashboard Page
exports.index = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        fleets.getFCPageList(function (fleets) {
            if (!fleets) {
                res.status(403).send("No fleets found<br><br><a href='/'>Go back</a>");
                return;
            }

            var userProfile = req.user;
            var sideBarSelected = 5;
            var fleets = fleets;
            res.render('fcFleetList.njk', {userProfile, sideBarSelected, fleets});
        })
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}

//Registers a fleet
exports.registerFleet = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        user.getLocation(req.user, function (location) {
            var fleetid = 0;
            try {
                fleetid = req.body.url.split("fleets/")[1].split("/")[0];
            } catch (e) { }

            if (!fleetid) {
                req.flash("content", {"class":"error", "title":"Error parsing the fleet ID", "message":"Did you copy the fleet URL from the fleet menu?"});
                res.status(400).redirect("/commander");
            } else {
                fleets.getMembers(req.user.characterID, req.user.refreshToken, fleetid, null, function (members) {
                    if (members===null) {
                        log.warn('routes.post /commander/, empty members. Cannot register fleet', { fleetid, characterID: req.user.characterID });
                        req.flash("content", {"class":"error", "title":"Empty fleet or other error.", "message":"Make sure you have fleet boss on the correct character."});
                        res.status(409).redirect("/commander");
                    } else {
                        var fleetInfo = {
                            fc: req.user,
                            backseat: {},
                            type: req.body.type,
                            status: "Not Listed",
                            location: null,
                            members: members,
                            url: req.body.url,
                            id: fleetid,
                            comms: { name: setup.fleet.comms[0].name, url: setup.fleet.comms[0].url },
                            errors: 0
                        }
                        fleets.register(fleetInfo, function (success, errTxt) {
                            if (!success) {
                                req.flash("content", {"class":"error", "title":"Fleet Already Registered", "message":"Are you trying to register the same fleet twice?"});
                                res.status(409).redirect('/commander');
                            } else {
                                req.flash("content", {"class":"info", "title":"Fleet Registered", "message":"Fleet ID: "+fleetid});
                                res.status(302).redirect('/commander/'+fleetid);
                            }
                        });
                    }
                })            
            }           
        })

    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}
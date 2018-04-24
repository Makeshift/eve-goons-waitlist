var path = require('path');
var setup = require('../setup.js');
var fleets = require('../fleets.js')(setup);
var users = require('../users.js')(setup);
var refresh = require('passport-oauth2-refresh');
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
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Registers a fleet
exports.registerFleet = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        users.getLocation(req.user, function (location) {
            var fleetid = 0;
            try {
                fleetid = req.body.url.split("fleets/")[1].split("/")[0];
            } catch (e) { }

            if (!fleetid) {
                res.status(400).send("Fleet ID unable to be parsed. Did you click fleets -> *three buttons at the top left* -> Copy fleet URL?<br><br><a href='/commander/'>Go back</a>")
                return;
            }

            fleets.getMembers(req.user.characterID, req.user.refreshToken, fleetid, null, function (members) {
                if (members===null) {
                    log.warn('routes.post /commander/, empty members. Cannot register fleet', { fleetid, characterID: req.user.characterID });
                    res.status(409).send("Empty fleet or other error" + "<br><br><a href='/commander'>Go back</a>")
                    return;
                }
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
                        res.status(409).send(errTxt + "<br><br><a href='/commander'>Go back</a>")
                    } else {
                        res.redirect(302, '/commander/'+fleetid)
                    }
                });
            })
        })

    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}
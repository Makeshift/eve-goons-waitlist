const setup = require('../setup.js');
const fleets = require('../models/fleets.js')(setup);
const api  = require('./apiController');
const users = require('../models/users.js')(setup);
const waitlist = require('../models/globalWaitlist.js')(setup);
const log = require('../logger.js')(module);
const wlog = require('../models/wlog.js');

//Render Fleet Management Page
exports.index = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.get(req.params.fleetid, function (fleet) {
            if (fleet) {
                waitlist.get(function(usersOnWaitlist) {
                    //Display the wait time in a nice format.
                    for(var i = 0; i < usersOnWaitlist.length; i++) {
                        var signuptime = Math.floor((Date.now() - usersOnWaitlist[i].signup)/1000/60);
                        var signupHours = 0;
                        while (signuptime > 59) {
                            signuptime -= 60;
                            signupHours++;
                        }
                        usersOnWaitlist[i].signup = signupHours +'H '+signuptime+'M';                
                    }
                    var userProfile = req.user;
                    var comms = setup.fleet.comms;
                    var sideBarSelected = 5;
                    res.render('fcFleetManage.njk', {userProfile, sideBarSelected, fleet, usersOnWaitlist, comms});
                })
            } else { 
                req.flash("content", {"class":"info", "title":"Woops!", "message":"That fleet was deleted."});
                res.status(403).redirect('/commander')
            }
        })
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect('/commander');
    }
}

//Invite a pilot to a specific fleet
exports.invitePilot = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.get(req.params.fleetid, function (fleet) {
            if(fleet.fc.characterID){
                fleets.invite(fleet.fc.characterID, fleet.fc.refreshToken, fleet.id, req.params.characterID, function (status, response) {
                    if(status == 200) {
                        waitlist.setAsInvited(req.params.tableID, function(invStatus, invResponse) {
                            if (invStatus == 200) {
                                var notificationPackage = {
                                    target: {
                                        id: req.params.characterID,
                                        name: null
                                    },
                                    sender: {
                                        id: req.user.characterID,
                                        name: req.user.name
                                    },
                                    comms: {
                                        name: fleet.comms.name,
                                        url: fleet.comms.url
                                    },
                                    message: req.user.name + ` is trying to invite you to a fleet. Please check your screen and join comms: ` + fleet.comms.name,
                                    sound: '/includes/inviteAlarm.mp3'
                                }
                                api.sendAlarm(notificationPackage, function(noteResponse){
                                    wlog.invited(req.params.characterID, req.user.characterID);
                                });
                            }
                            res.status(invStatus).send(invResponse);
                        });
                    } else {
                        var resStr = response.split("'")[3];
                        if(!resStr){
                            resStr = response.split("\"")[3];
                        }
                        
                        res.status(status).send(resStr);
                    }
                });
            } else {
                res.status(400).send("ESI Error: Offline Waitlist Mode.");
            }
           
        })

    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Remove a specific pilot from the waitlist
exports.removePilot = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        waitlist.remove(req.params.tableID, function (status, response) {
            wlog.removed(req.params.characterID, req.user.characterID);
            res.status(status).send(response);
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update fleet comms.
exports.updateComms = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.updateComms(req.params.fleetid, { name: req.body.name, url: req.body.url }, function () {
            res.redirect('/commander/' + req.params.fleetid);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update fleet type
exports.updateType = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.updateType(req.params.fleetid, req.body.type, function () {
            res.redirect('/commander/' + req.params.fleetid);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update the Fleet Status
exports.updateStatus = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.updateStatus(req.params.fleetid, req.body.status, function () {
            res.redirect('/commander/' + req.params.fleetid);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update the Fleet Commander
exports.updateCommander = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.updateFC(req.params.fleetid, req.user, function() {
            res.redirect('/commander/'+req.params.fleetid);
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Update the Backseat
exports.updateBackseat = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.updateBackseat(req.params.fleetid, req.user, function() {
            res.redirect('/commander/'+req.params.fleetid);
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Close the fleet
exports.closeFleet = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        fleets.delete(req.params.fleetid, function () {
            req.flash("content", {"class":"success", "title":"The fleet has been closed.", "message":"You can now re-register this fleet."});
            res.redirect('/commander/');
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your role.numeric > 0? <br><br><a href='/'>Go back</a>");
    }
}

//Remove all pilots from the waitlist
exports.clearWaitlist = function(req, res) {
    if (users.isRoleNumeric(req.user, 1)) {
        waitlist.get(function(pilotsOnWaitlist) {
            log.debug(req.user.name + " is removing all pilots from the waitlist.");
            for (var i = 0; i < pilotsOnWaitlist.length; i++) {
                waitlist.remove(pilotsOnWaitlist[i]._id, function(){});
            }
            res.status(200).send();
        })        
    } else {
        res.status(400).send("You do not have permission to complete this action. Are you an FC?");
    }
}

/*
* Gets the fleet info
* @params req{}
* @res res{}
*/
exports.getInfo = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(401).send("Not Authenticated");
        return;
    }

    fleets.get(req.params.fleetid, function (fleet) {
        if(!fleet){
            res.status(404).send("Fleet Not Found");
            return;
        }
        res.status(200).send({
            "fc": {
                "characterID": fleet.fc.characterID,
                "name": fleet.fc.name
            },
            "backseat": {
                "characterID": fleet.backseat.characterID,
                "name": fleet.backseat.name
            },
            "type": fleet.type,
            "status": fleet.status,
            "comms": fleet.comms,
            "location": fleet.location
        });
    });

}
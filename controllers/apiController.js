const path = require('path');
const setup = require('../setup.js');
const cache = require('../cache.js')(setup);
const fleets = require('../fleets.js')(setup);
const user = require('../user.js')(setup);
const users = require('../users.js')(setup);
const refresh = require('passport-oauth2-refresh');
const banner = require('../waitlistBanner.js')(setup);
const waitlist = require('../globalWaitlist.js')(setup);
const log = require('../logger.js')(module);
const wlog = require('../wlog.js');
const api = require('./apiController');

exports.waypoint = function(req, res) {
    if (req.isAuthenticated() && typeof req.params.systemID !== "undefined") {
        user.setDestination(req.user, req.params.systemID, function(response) {
            res.send(response);
        });
    } else {
        res.status(400).send("Not authorised or target ID missing");
    }
}

exports.showInfo = function(req, res) {
    if (req.isAuthenticated() && typeof req.params.targetID !== "undefined") {
        user.showInfo(req.user, req.params.targetID, function(response) {
            res.send(response);
        });
    } else {
        res.status(400).send("Not authorised or target ID missing");
    }
}

exports.openMarket = function(req, res) {
    if(req.isAuthenticated() && typeof req.params.targetID !== "undefined") {
        user.openMarketWindow(req.user, req.params.targetID, function(response) {
            res.send(response);
        });
    } else {
        res.status(400).send("Not authorised or target ID missing");
    }
}
//Show the fleet at a glance window.
exports.fleetAtAGlance = function(req, res) {

    fleets.get(req.params.fleetid, function (fleet) {
        if (fleet) {
            var ships = [];
            
            var counter = 0;
            for(var i = 0; i < fleet.members.length; i++) { //where the fuck is shipID coming from? I'm bad
                cache.get(fleet.members[i].ship_type_id, null, function(ship) {
                ships.push(ship); //<<<<<
                counter++;
                    if(counter === fleet.members.length) {
                        module.createShipsHTML(ships, req.params.filter, res);
                    }
                });
            }
        } else {
            res.status(400).send("No fleet found");
        }
    });     
}

//Store a new banner
exports.addBanner = function(req, res){
    if(req.isAuthenticated() && req.user.roleNumeric > 0){
        banner.createNew(req.user, req.body.text, req.body.type, function(status){
            res.status(status).send();
        })
    } else {
        res.status(400).send("Not authorised");
    }
}

//Hide last banner
exports.removeBanner = function(req, res){
    if(req.isAuthenticated() && req.user.roleNumeric > 0){
        banner.hideLast(function(status){
            res.status(status).send();
        })
    } else {
        res.status(400).send("Not authorised");
    }
}

//Count the total number of each ship and make the table.
module.createShipsHTML = function (ships, filter, res) {
    var fleet = [];

    while(ships.length > 0) {
        var ship = ships.pop();
        
        if(fleet[ship.id]) {
            fleet[ship.id].count += 1;
        } else {
            fleet[ship.id] = {
                id: ship.id,
                name: ship.name,
                count: 1
            }
        }
    }

    //Sort by count then name.
    fleet.sort(function(a,b) { 
        if(a.count < b.count) {
            return 1;
        } else if (a.count > b.count) {
            return -1;
        } else {
            if(a.name > b.name) return 1;
            return -1;
        }
    });
    
    var filterShipIDs = setup.fleetCompFilters[filter];
    
    var count = 1;
    var html = `<table class="table table-striped table-sm">
    <tbody>`;
    for (ship in fleet) {
        if(filterShipIDs === undefined || filterShipIDs !== undefined && filterShipIDs.includes(fleet[ship].id)) {
            html += `<td class="tw35"><img src="https://image.eveonline.com/Render/${fleet[ship].id}_32.png" alt="Ship Icon"></td>
            <td class="tw20per"><a href="#">${fleet[ship].name}</a></td>
            <td>${fleet[ship].count}</td>`

            if (count % 3 === 0) {
                html += `</tr>
                <tr>`
            }
            count++;
        }
    }

    html += `</tbody>
    </table>`;
    
    res.status(200).send(html);
}

//Create a notification for the user.
exports.alarmUser = function(req, res) {   
    if(req.isAuthenticated && req.user.roleNumeric > 0) {
        fleets.get(req.params.fleetid, function(fleetObject) {
            var notificationPackage = {
                target: {
                    id: req.params.targetid,
                    name: null
                },
                sender: {
                    id: req.user.characterID,
                    name: req.user.name
                },
                comms: {
                    name: fleetObject.comms.name,
                    url: fleetObject.comms.url
                },
                message: req.user.name + ` is trying to get your attention. Please join them on comms: `+fleetObject.comms.name,
                sound: '/includes/alarm.mp3'
            }

            api.sendAlarm(notificationPackage, function(result) {
                if (result == 200){
                    wlog.alarm(req.params.targetid, req.user.characterID);
                    res.status(200).send();
                } else {
                    res.status(400).send();
                }
            })
        })
    } else {
        res.status(400).send("Forbidden");
    }   
}

//Send notification package to the user
exports.sendAlarm = function (notifyPackage, cb) {   
    users.findAndReturnUser(Number(notifyPackage.target.id), function(userProfile) {
        notifyPackage.appName = `Goon Incursion Squad`;
        notifyPackage.imgUrl = `/includes/img/gsf-bee.png`;
        notifyPackage.target.name = userProfile.name;
        notifyPackage.message = notifyPackage.message + `\n~~ Notification for: `+notifyPackage.target.name+` ~~`;

        const longpoll = require("express-longpoll")(require('express'));
        longpoll.publishToId("/poll/:id", notifyPackage.target.id, {
            data: notifyPackage
        });
    })

    if (typeof cb === "function") { 
        cb(200);
    }
}
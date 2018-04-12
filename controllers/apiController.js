var template = require('../template.js');
var path = require('path');
var setup = require('../setup.js');
var cache = require('../cache.js')(setup);
var fleets = require('../fleets.js')(setup);
var users = require('../users.js')(setup);
var refresh = require('passport-oauth2-refresh');
var waitlist = require('../globalWaitlist.js')(setup);
const log = require('../logger.js')(module);

exports.waypoint = function(req, res) {
    if (req.isAuthenticated() && typeof req.params.systemID !== "undefined") {
        users.setDestination(req.user, req.params.systemID, function(response) {
            res.send(response);
        });
    }
}

exports.showInfo = function(req, res) {
    if (req.isAuthenticated && typeof req.params.targetID !== "undefined") {
        users.showInfo(req.user, req.params.targetID, function(response) {
            res.send(response);
        });
    }
}

//Show the fleet at a glance window.
exports.fleetAtAGlance = function(req, res) {

    fleets.get(req.params.fleetid, function (fleet) {
        if (fleet) {
            html = "";
            html += `<table class="table table-striped table-sm">
            <tbody>`
                //make the thing of ships
                var fleetArray = [];
                for(var i = 0; i < fleet.members.length; i++)
                {
                    var shipID = Number(fleet.members[i].ship_type_id);                  

                    if(fleetArray[shipID]) {
                        //Increase by one
                        fleetArray[shipID].count += 1;
                    } else {
                        //cache.get(shipID, function(ship) {
                            fleetArray[shipID] = {
                                ship_type_id: shipID,
                                count: 1,
                                ship_type_name: null
                            }
                        //});
                    }
                }
                html += `<tr>`
                var count = 1;
                for( i in fleetArray) {
                    html += `<td class="tw35"><img src="https://image.eveonline.com/Render/${fleetArray[i].ship_type_id}_32.png" alt="Ship Icon"></td>
                      <td class="tw20per"><a href="#">${fleetArray[i].ship_type_name}</a></td>
                      <td>${fleetArray[i].count}</td>`
                    if (count % 3 === 0) {
                        html += `</tr><tr>`
                    }
                    count++;
                }
                html += `</tbody></table>`
            res.status(200).send(html);
        } else {
            res.status(400).send("No fleet found");
        }
    });   
}
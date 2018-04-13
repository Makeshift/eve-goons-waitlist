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
            var ships = [];
            
            var counter = 0;
            for(var i = 0; i < fleet.members.length; i++) { //where the fuck is shipID coming from? I'm bad
                cache.get(fleet.members[i].ship_type_id, function(ship) {
                ships.push(ship); //<<<<<
                counter++;
                    if(counter === fleet.members.length) {
                        module.createShipsHTML(ships, res);
                    }
                });
            }
        } else {
            res.status(400).send("No fleet found");
        }
    });     
}

//Count the total number of each ship and make the table.
module.createShipsHTML = function (ships, res) {
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
         if(a.count < b.count) return 1;
         if(a.name > b.name) return -1;
         return  0;
    });

    var count = 1;
    var html = `<table class="table table-striped table-sm">
    <tbody>`;
    for (ship in fleet) {
        html += `<td class="tw35"><img src="https://image.eveonline.com/Render/${fleet[ship].id}_32.png" alt="Ship Icon"></td>
        <td class="tw20per"><a href="#">${fleet[ship].name}</a></td>
        <td>${fleet[ship].count}</td>`

        if (count % 3 === 0) {
            html += `</tr>
            <tr>`
        }
        count++;
    }

    html += `</tbody>
    </table>`;
    
    res.status(200).send(html);
}
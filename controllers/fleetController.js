const setup = require('../setup.js');
const broadcast = require('./broadcastController.js');
const cache = require('../cache.js')(setup);
const esi = require('eve-swagger');
const fleets = require('../models/fleets.js')(setup);
const user = require('../models/user.js')(setup);
const users = require('../models/users.js')(setup);
const waitlist = require('../models/waitlist.js')(setup);
const wlog = require('../models/wlog.js');


/*
* FleetWaitlist page
* @params req{}
* @return res{}
*/
exports.index = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect('/commander');       
        return;
    }
    
    fleets.get(req.params.fleetID, function(fleet){
        if(!fleet){
            req.flash("content", {"class":"info", "title":"Woops!", "message":"That fleet was deleted."});
            res.status(403).redirect('/commander');
            return;
        }

        waitlist.get(function(usersOnWaitlist) {
            var userProfile = req.user;
            var comms = setup.fleet.comms;
            var sideBarSelected = 5;
            res.render('fcFleetManage.njk', {userProfile, sideBarSelected, fleet, usersOnWaitlist, comms});
        })
    })
}

/*
* Invites a pilot to the fleet
* @params req{}
* @return res{}
*/
exports.invite = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }

    fleets.get(req.params.fleetID, function(fleet){
        if(!fleet){
            res.status(404).send("Fleet not Found");
            return;
        }

        if(fleet && !fleet.fc.characterID){
            res.status(400).send("ESI Error: Offline Waitlist Mode.");
            return;
        }
        
        user.getRefreshToken(fleet.fc.characterID, function(accessToken){
            esi.characters(fleet.fc.characterID, accessToken).fleet(req.params.fleetID).invite({ "character_id": req.params.characterID, "role": "squad_member"}).then(result => {
                wlog.invited(req.params.characterID, req.user.characterID);
                broadcast.alarm(req.params.characterID, req.params.fleetID, req.user, "invite");
                res.status(200).send();
			}).catch(error => {
                var resStr = error.message.split("'")[3];
                if(!resStr){
                    resStr = error.message.split("\"")[3];
                }

                res.status(400).send(resStr);
			});
		})
    })
}

/*
* Shuts down a fleet
* @params req{}
* @return res{}
*/
exports.delete = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect('/commander');
        return;
    }


    fleets.close(req.params.fleetID, function(cb){
        res.status(cb).send();
    });
}

/*
* Gets the fleet info of a specific fleet
* @params req{ fleetID (int)}
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

/*
* Returns a json package of all members in a fleet for AJAX UIs
* @params req{}
* @res res{}
*/
exports.getMembersJson = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(401).send("Not Authenticated");
        return;
    }

    fleets.get(req.params.fleetID, function(fleet){
        if(!fleet){
            res.status(404).send("Fleet not found");
            return;
        }

        var promises = [];

        // var membersObject = [];
        for(var i = 0; i < fleet.members.length; i++){
            
            var signuptime = Math.floor((Date.now() - Date.parse(fleet.members[i].join_time))/1000/60);
            var signupHours = 0;
            while (signuptime > 59) {
                signuptime -= 60;
                signupHours++;
            }
        
            var index = i;

            var promise = new Promise(function(resolve, reject) {
                cache.get(Number(fleet.members[index].solar_system_id), 86400, function(systemObject){
                    resolve({
                        "pilot":{
                            "characterID": fleet.members[index].character_id,
                            "name": null
                        },
                        "waitlistMain": {},
                        "activeShip": fleet.members[index].ship_type_id,
                        "availableFits": {},
                        "system": {
                            "systemID": fleet.members[index].solar_system_id,
                            "name": systemObject.name
                        },
                        "joined": signupHours +'H '+signuptime+'M'
                    });
                });
            });

            promises.push(promise);
        }

        Promise.all(promises).then(function(members) {
            res.status(200).send(members);
        });

        // for(let i = 0; i < membersObject.length; i++){
        //     cache.get(membersObject[i].system.systemID, 86400, function(systemObject){
        //         console.log(systemObject)
        //         membersObject[i].system.name = systemObject.name;
        //     });
        // }
        
        /*
        pilots.sort(function(a,b) {
            if(a.name > b.name) return 1;
            return -1;
        })*/
    });
    
}

/*
* Returns a json package of all fleets for AJAX UIs
* @params req{}
* @res res{}
*/
exports.getFleetJson = function(req, res){
    if(!users.isRoleNumeric(req.user, 0)){
        res.status(401).send("Not Authenticated");
        return;
    }

    //Strip out sensitive superfluous information
    fleets.getFleetList(function(fleetList){
        let payload = [];
        for(let i = 0; i < fleetList.length; i++){
            if(fleetList[i].status !== "Not Listed"){
                payload.push({
                    "fc": {
                        "characterID": (fleetList[i].fc.characterID) ? fleetList[i].fc.characterID : "",
                        "name": (fleetList[i].fc.name) ? fleetList[i].fc.name : "" 
                    },
                    "backseat": {
                        "characterID": (fleetList[i].backseat.characterID) ? fleetList[i].backseat.characterID : "",
                        "name": (fleetList[i].backseat.name) ? fleetList[i].backseat.name : "" 
                    },
                    "type": fleetList[i].type,
                    "status": fleetList[i].status,
                    "size": fleetList[i].members.length,
                    "location": {
                        "systemID": (fleetList[i].system) ? fleetList[i].location.systemID : 0,
                        "name": (fleetList[i].system) ? fleetList[i].location.name : ""
                    },
                    "comms": {
                        "name": fleetList[i].comms.name,
                        "url": fleetList[i].comms.url
                    }
                });
            }
        }
        res.status(200).send(payload);
    });
}

/*
* Updates the Backseating FC
* @params req{}
* @res res{}
*/
exports.updateBackseat = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }

    let backseatObject = {"characterID": req.user.characterID, "name": req.user.name};
    fleets.get(req.params.fleetID, function(fleet){
        if(fleet.backseat.characterID == req.user.characterID || fleet.fc.characterID == req.user.characterID){
            backseatObject = {
                "characterID": null,
                "name": null
            }
        } 

        fleets.updateBackseat(fleet.id, backseatObject, function(result){
            res.status(result).send();
        })
    })
}

/*
* Updates the FC (Boss)
* @params req{}
* @res res{}
*/
exports.updateCommander = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }
    
    fleets.updateCommander(req.params.fleetID, req.user, function(result){
        res.status(result).send();
    })
}

/*
* Updates fleet comms
* @params req{}
* @res res{}
*/
exports.updateComms = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }

    fleets.updateComms(req.params.fleetID, req.body.url, req.body.name, function(result){
        res.status(result).send();
    })
}

/*
* Updates the fleet status
* @params req{}
* @res res{}
*/
exports.updateStatus = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }
    
    fleets.updateStatus(req.params.fleetID, req.body.status, function(result){
        res.status(result).send();
    })
}

/*
* Updates the fleet type
* @params req{}
* @res res{}
*/
exports.updateType = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }
    
    fleets.updateType(req.params.fleetID, req.body.type, function(result){
        res.status(result).send();
    })
}
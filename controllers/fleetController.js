const setup = require('../setup.js');
const broadcast = require('./broadcastController.js');
const esi = require('eve-swagger');
const fleets = require('../models/fleets.js')(setup);
const user = require('../models/user.js')(setup);
const users = require('../models/users.js')(setup);
const waitlist = require('../models/waitlist.js')(setup);
const wlog = require('../models/wlog.js');


/*
* Invites a pilot to the fleet
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
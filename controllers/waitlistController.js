const setup = require('../setup.js');
const banner = require('../models/waitlistBanner.js')(setup);
const broadcast = require('./broadcastController.js');
const fleets = require('../models/fleets')(setup);
const user = require('../models/user.js')(setup);
const users = require('../models/users.js')(setup);
const waitlist = require('../models/waitlist.js')(setup);

/*
* Render login page OR waitlist page
* @params req{}
* @return res{}
*/
exports.index = function(req, res){
    if(!req.isAuthenticated()){
        res.render('statics/login.html');
        return;
    }

    banner.getLast(function(banner){
        fleets.getFleetList(function (fleets) {           
            var fleetCount = 0;
            for (var i = 0; i < fleets.length; i++) {
                if (fleets[i].status !== "Not Listed") fleetCount++;
            }

            waitlist.getQueue((!!req.user.waitlistMain)? req.user.waitlistMain.characterID : 0, function(queueInfo) {
                waitlist.checkCharsOnWaitlist(req.user.account.pilots, function(charsOnWl) {                   
                    var userProfile = req.user;
                    var sideBarSelected = 1;
                    res.render('waitlist.njk', {userProfile, sideBarSelected, banner, fleets, fleetCount, charsOnWl, queueInfo});
                })
            })
        })
    })
}

/*
* Adds pilot to the waitlist
* @params req{}
* @return res{}
*/
exports.signup = function(req, res){
    if(!req.isAuthenticated()){
        res.render('statics/login.html');
        return;
    }
    //TODO: Add check is pilot whitelisted
    //TODO: Add check - is pilot online?
    users.findAndReturnUser(Number(req.body.pilot), function(pilot){
        if(req.params.type == "main"){
            var waitlistMain = {
                "characterID": pilot.characterID,
                "name": pilot.name
            }//Sets the waitlist main for the users session
            let accountMainID = (req.user.account.main)? req.user.characterID : req.user.account.mainID;
            user.setWaitlistMain(accountMainID, waitlistMain, function(err){
                if(err){
                    req.flash("content", {"class": "error", "title": "Woops!", "message": "We were unable to set your waitlist main."});
                }
            })
        } else {
            var waitlistMain = {
                "characterID": req.user.waitlistMain.characterID,
                "name": req.user.waitlistMain.name
            }
        }

        var contact = {
            "xmpp": req.user.settings.xmpp,
            "pingTarget": req.user.characterID
        }
        
        waitlist.add(waitlistMain, pilot, req.body.ship, contact, req.user.newbee, function(result){
            req.flash("content", {"class": result.class, "title": result.title, "message": result.message});
            res.redirect(`/`);
        });
    })
}

/*
* Removes pilot, triggered by the pilot
* @params req{}
* @return res{}
*/
exports.selfRemove = function(req, res){
    if(!req.isAuthenticated()){
        res.render('statics/login.html');
        return;
    }

    waitlist.remove(req.params.type, req.params.characterID, function(result){
        res.status(result).send();
    })
}

/*
* Admin removal of a pilot
* @params req{}
* @return res{}
*/
exports.removePilot = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorized");
    }

    waitlist.adminRemove(req.params.characterID, function(cb){
        res.status(cb).send();
    })
}

/*
* Alarms a pilot
* @params req{}
* @return res{}
*/
exports.alarm = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }
    broadcast.alarm(req.params.characterID, req.params.fleetID, req.user, "alarm");
    res.status(200).send();
}


/*
* Removes all pilots on the waitlist
* @params req{}
* @return res{}
*/
exports.clearWaitlist = function(req, res) {
    if(!users.isRoleNumeric(req.user, 1)){
        res.status(403).send("Not Authorised");
        return;
    }
    

    waitlist.get(function(pilotsOnWaitlist) {
        for (var i = 0; i < pilotsOnWaitlist.length; i++) {
            waitlist.remove(pilotsOnWaitlist[i]._id, function(result){
                
            });
        }
        res.status(200).send();
    })        
}
const setup = require('../setup.js');
const esi = require('eve-swagger');
const banner = require('../models/waitlistBanner.js')(setup);
const fleets = require('../models/fleets.js')(setup);
const user = require('../models/user.js')(setup);
const users = require('../models/users.js')(setup);
const waitlist = require('../models/waitlist.js')(setup);
const log = require('../logger.js')(module);
const wlog = require('../models/wlog');

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
        fleets.getFCPageList(function (fleets) {           
            var fleetCount = 0;
            for (var i = 0; i < fleets.length; i++) {
                if (fleets[i].status !== "Not Listed") fleetCount++;
            }

            waitlist.getQueue((req.user.waitlistMain == "undefined")? req.user.waitlistMain.characterID : 0, function(queueInfo) {
                waitlist.checkCharsOnWaitlist(req.user.account.pilots, function(charsOnWl) {                   
                    var userProfile = req.user;
                    var sideBarSelected = 1;
                    res.render('waitlist.njk', {userProfile, sideBarSelected, banner, fleets, fleetCount, charsOnWl, queueInfo});
                })
            })
        })
    })
}

exports.signup = function(req, res){
    if(!req.isAuthenticated()){
        res.render('statics/login.html');
        return;
    }

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

exports.remove = function(req, res){
    if(!req.isAuthenticated()){
        res.render('statics/login.html');
        return;
    }

    waitlist.remove(req.params.type, req.params.characterID, function(result){
        res.status(200).send();
    })
}
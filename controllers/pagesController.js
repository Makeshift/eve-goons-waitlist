var path = require('path');
var setup = require('../setup.js');
var fleets = require('../fleets.js')(setup);
var esi = require('eve-swagger');
var waitlist = require('../globalWaitlist.js')(setup);
const log = require('../logger.js')(module);

//Render Index/login Page
exports.index = function(req, res) {
    if (req.isAuthenticated()) {
        //Grab all fleets			
        fleets.getFCPageList(function (fleets) {           
            var fleetCount = 0;
            for (var i = 0; i < fleets.length; i++) {
                if (fleets[i].status !== "Not Listed") fleetCount++;
            }
            
            waitlist.getUserPosition(req.user.characterID, function(position, found, name) {
                waitlist.getCharsOnWaitlist(req.user.characterID, function(charList) {
                    var userProfile = req.user;
                    var sideBarSelected = 1;
                    res.render('waitlist.njk', {userProfile, sideBarSelected, fleets, fleetCount, charList, position});
                })
            })
        });
    } else {
        res.render('login.html');
    }
};

//Join the waitlist
exports.joinWaitlist = function(req, res) {
    if (req.isAuthenticated()) {
        var alt = false;
        if (req.user.name.toLowerCase() != req.body.name.toLowerCase()) {
            esi.characters.search.strict(req.body.name).then(function (results) {
                //This can be a user later
                alt = {
                    name: req.body.name,
                    id: results[0],
                    avatar: "http://image.eveonline.com/Character/" + results[0] + "_128.jpg"
                };
                submitAddition();
            }).catch(function (err) {
                log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
                req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.body.name + ". Did you spell your pilot name correctly?"});
                res.redirect(`/`);
            })
        } else {
            submitAddition();
        }

        function submitAddition() { //Functionception
            var userAdd = {
                name: req.body.name,
                alt: alt,
                user: req.user,
                ship: req.body.ship,
                invited: "invite-default",
                signupTime: Date.now()
            }
            waitlist.addToWaitlist(userAdd, function () {
                req.flash("content", {"class":"success", "title":"You're on the waitlist!", "message":req.body.name + " was added to the waitlist, see you in fleet soon."});
                res.redirect(`/`);
            });
        }
    }
}

//Leave the waitlist
exports.removeSelf = function(req, res) {
    if (req.isAuthenticated()) {
        waitlist.selfRemove(req.user.characterID, function () {
            req.flash("content", {"class":"success", "title":"Success!", "message":"You have removed yourself from the waitlist. See you next time."});
            res.redirect('/')
        })
    }
}

//Logout
exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
}
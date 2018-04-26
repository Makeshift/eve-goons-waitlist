var path = require('path');
var setup = require('../setup.js');
var bans = require('../bans.js')(setup);
var esi = require('eve-swagger');
const log = require('../logger.js')(module);

//Render Ban Page
exports.index = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 3) {
        bans.getBans(function(activeBans) {
            
            for ( var i = 0; i < activeBans.length; i++) {
                activeBans[i].createdAt = new Date(activeBans[i].createdAt).toDateString();
            }

            //Sort by name then date.
            activeBans.sort(function(a,b) { 
                if(a.pilotName > b.pilotName) return 1;
                if(a.createdAt > b.createdAt) return -1;
                return  0;
            });

            activeBans.sort(function(a,b) { 
                if(a.pilotName > b.pilotName) {
                    return 1;
                } else {
                    return -1;
                }
            });

            var userProfile = req.user;
            var sideBarSelected = 7;
            var banList = activeBans;
            res.render('adminBan.njk', {userProfile, sideBarSelected, banList});
        })
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our Senior FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}

//Add a Ban
exports.createBan = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 4) {
        esi.characters.search.strict(req.body.pilotName).then(function (results) {
            var banObject = {
                characterID: results[0],
                pilotName: req.body.pilotName,
                banType: req.body.type,
                notes: req.body.notes,
                banAdmin: req.user,
                createdAt: Date.now(),
                deletedAt: {} 
            }
            
            bans.register(banObject, function (success, errTxt) {
                if (!success) {
                    req.flash("content", {"class":"error", "title":"Woops!", "message": errTxt});
                    res.status(409).redirect('/admin/bans')
                } else {
                    req.flash("content", {"class":"success", "title":"Ban Issued", "message":req.body.pilotName+" has been banned."});
                    res.status(302).redirect('/admin/bans');
                }
            });
        }).catch(function (err) {
            log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
            req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.body.pilotName + ". Did you spell the pilots name correctly?"});
            res.status(409).redirect('/admin/bans');
        })
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"You are not allowed to create bans. Think this is an error? Contact a member of leadership."});
        res.status(403).redirect('/admin/bans')
    }
}

//Revoke a ban
exports.revokeBan = function(req, res) {
    if(req.isAuthenticated() && req.user.roleNumeric > 4) {
        var banID = req.params.banID;
        var banAdmin = req.user.name;

        bans.revokeBan(banID, banAdmin, function() {
            req.flash("content", {"class":"success", "title":"Ban revoked", "message":"The requested ban has been revoked."});
            res.redirect('/admin/bans');
        });
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"You are not allowed to revoke bans. Think this is an error? Contact a member of leadership."});
        res.status(403).redirect('/admin/bans');
    }
}
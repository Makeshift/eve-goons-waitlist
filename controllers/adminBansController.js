var template = require('../template.js');
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
            
            var userProfile = req.user;
            var sideBarSelected = 7;
            var banList = activeBans;
            res.render('adminBan.njk', {userProfile, sideBarSelected, banList});
        })
    } else {
        res.status(403).send("You don't have permission to view this page");
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
                    res.status(409).send(errTxt + "<br><br><a href='/admin/bans'>Go back</a>")
                } else {
                    res.redirect(302, '/admin/bans');
                }
            });
        }).catch(function (err) {
            log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
            res.redirect(`/admin/bans?err=Some error happened! Does that character exist? (DEBUG: || ${err.toString().split("\n")[0]} || ${err.toString().split("\n")[1]} || < Show this to Makeshift!`);
        })
    }
}

//Revoke a ban
exports.revokeBan = function(req, res) {
    if(req.isAuthenticated() && req.user.roleNumeric > 4) {
        var banID = req.params.banID;
        var banAdmin = req.user.name;

        bans.revokeBan(banID, banAdmin, function() {
            res.redirect('/admin/bans');
        });
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
    }
}
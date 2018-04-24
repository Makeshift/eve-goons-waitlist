var path = require('path');
var setup = require('../setup.js');
var users = require('../users.js')(setup);
var esi = require('eve-swagger');
const log = require('../logger.js')(module);

//Render FC Management Page
exports.index = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric >= 4) {
        var userProfile = {};
        if (typeof req.query.user != "undefined") {
            users.findAndReturnUser(Number(req.query.user), function(profile) {
                manageUser = profile;
                genPage();
            })
        } else {
            manageUser = req.user;
            genPage();
        }
        
        function genPage() {
            var roleDropdownContentHtml = "";
            for (var i = 1; i < setup.userPermissions.length; i++) {
                if (setup.userPermissions[i] !== null) {
                    roleDropdownContentHtml += `<option value="${i}">${setup.userPermissions[i]}</option>`;
                }
            }
            (setup.userPermissions[0] !== null)? roleDropdownContentHtml += `<option value="${0}">${setup.userPermissions[0]}</option>`: null;
            
            users.getFCList(function(fcList) {
                //Sort by role then name.
                fcList.sort(function(a,b) { 
                    if(a.roleNumeric < b.roleNumeric) {
                        return 1;
                    } else if (a.roleNumeric > b.roleNumeric) {
                        return -1;
                    } else {
                        if(a.name > b.name) return 1;
                        return -1;
                    }
                });

                var sideBarSelected = 7;
                var userProfile = req.user;
                var fcs = fcList;
                res.render('adminFC.njk', {userProfile, sideBarSelected, fcs, manageUser, roleDropdownContentHtml});	
            });
        }
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 4? <br><br><a href='/'>Go back</a>");
    }
}

//Updates a users permission level.
exports.updateUser = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 4) {
        esi.characters.search.strict(req.body.pilotName).then(function (results) {
            users.updateUserPermission(results[0], req.body.permission, req.user, res)
            {
                res.redirect('/admin/commanders');
            }
        }).catch(function (err) {
            log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
            res.redirect(`/?err=Some error happened! Does that character exist? (DEBUG: || ${err.toString().split("\n")[0]} || ${err.toString().split("\n")[1]} || < Show this to Makeshift!`);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 4? <br><br><a href='/'>Go back</a>");
    }
}

//Sets a pilot as Trainee (Reserved for low level admins).
exports.setTrainee = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 3) {
        esi.characters.search.strict(req.body.pilotName).then(function (results) {
            users.findAndReturnUser(results[0], function(userObject) {
            if (userObject.roleNumeric === 0) {
                users.updateUserPermission(results[0], 1, req.user, res)
                {
                    res.redirect('/admin/commanders');
                }
            } else {
                res.status(403).send("You could not add this pilot as a trainee, is it possible that they're already an FC?");
            }
            })
        }).catch(function (err) {
            log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
            res.redirect(`/?err=Some error happened! Does that character exist? (DEBUG: || ${err.toString().split("\n")[0]} || ${err.toString().split("\n")[1]} || < Show this to Makeshift!`);
        })
    } else {
        res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 4? <br><br><a href='/'>Go back</a>");
    }
}
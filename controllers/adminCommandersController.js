var path = require('path');
var setup = require('../setup.js');
var users = require('../models/users.js')(setup);
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
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our Senior FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}

//Updates a users permission level.
exports.updateUser = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 4) {
        esi.characters.search.strict(req.body.pilotName).then(function (results) {
            users.updateUserPermission(results[0], req.body.permission, req.user, res)
            {
                req.flash("content", {"class":"success", "title":"User permission updated.", "message":"Tell the user to refresh their browser twice for the changes to take effect."});
                res.redirect('/admin/commanders');
            }
        }).catch(function (err) {
            log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
            req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.body.pilotName + ". Please make sure they have logged in at least once before."});
            res.status(409).redirect('/admin/commanders');
        })
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"You are not allowed to adjust the permissions of this user. Think this is an error? Contact a member of leadership."});
        res.status(403).redirect('/admin/commanders');
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
                    req.flash("content", {"class":"success", "title":"User permission updated.", "message":"Tell the user to refresh their browser twice for the changes to take effect."});
                    res.redirect('/admin/commanders');
                }
            } else {
                req.flash("content", {"class":"error", "title":"Woops!", "message":"You could not add this pilot as a trainee, is it possible that they're already an FC?"});
                res.status(403).redirect('/admin/commanders');
            }
            })
        }).catch(function (err) {
            log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
            req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.body.pilotName + ". Please make sure they have logged in at least once before."});
            res.status(409).redirect('/admin/commanders');
        })
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"You are not allowed to adjust the permissions of this user. Think this is an error? Contact a member of leadership."});
    }
}
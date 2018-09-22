var esi = require('eve-swagger');
var setup = require('../setup.js');
var users = require('../models/users.js')(setup);
const log = require('../logger.js')(module);

//Render FC Management Page
exports.index = function(req, res) {
    if (users.isRoleNumeric(req.user, 4)){
        var manageUser = null;
        if (typeof req.query.user != "undefined") {
            users.findAndReturnUser(Number(req.query.user), function(profile) {
                
                users.getAlts(profile.characterID, function(Alts){
                    manageUser = profile;
                    manageUser.account.pilots = Alts;
                    genPage();
                })
            })
        } else {
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
                    if(a.role.numeric < b.role.numeric) {
                        return 1;
                    } else if (a.role.numeric > b.role.numeric) {
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
    if(!users.isRoleNumeric(req.user, 4))
    {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"You are not allowed to adjust the permissions of this user. Think this is an error? Contact a member of leadership."});
        res.status(403).redirect('/admin/commanders');
        return;
    }
    //Only allow senior FC to make people trainees
    if(req.user.role.numeric == 4){
        req.body.permission = 1;
    }

    //Search for and update user record
    esi.characters.search.strict(req.body.pilotName).then(function (results) {       
        users.getMain(Number(results[0]), function(targetUser){
            if(!!!targetUser){
                req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.body.pilotName + ". Please make sure they have logged in at least once before."});
                res.status(409).redirect('/admin/commanders');
                return;
            }
            if(targetUser.characterID == req.user.characterID){
                req.flash("content", {"class":"error", "title":"Woops!", "message":"You cannot change your own permission!"});
                res.status(400).redirect('/admin/commanders');
                return;
            }
            if(req.user.role.numeric == 4 && targetUser.role.numeric > 1){
                req.flash("content", {"class":"error", "title":"Woops!", "message":"You're not allowed to change that FCs permission!"});
                res.status(400).redirect('/admin/commanders');
                return;
            }
            
            users.updateUserPermission(targetUser, req.body.permission, req.user,  function(cb)
            {
                req.flash("content", {"class":"success", "title":"User permission updated.", "message":"Tell the user to refresh their browser twice for the changes to take effect."});
                res.status(200).redirect('/admin/commanders');
                return;
            })
        })
    }).catch(function (err) {
        log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
        req.flash("content", {"class":"error", "title":"Woops!", "message":"Something went wrong!"});
        res.status(400).redirect('/admin/commanders');
    })
}
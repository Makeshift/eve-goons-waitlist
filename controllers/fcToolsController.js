var fs = require('fs');
var esi = require('eve-swagger');
var setup = require('../setup.js');
var user = require('../models/user.js')(setup);
var users = require('../models/users.js')(setup);
const log = require('../logger.js')(module);
const wlog = require('../models/wlog.js');

//Renders the page for Fit Scanning
exports.fitTool = function(req, res) { 
    if (users.isRoleNumeric(req.user, 1)) {
            var userProfile = req.user;
            var sideBarSelected = 6;
            res.render('toolsFits.njk', {userProfile, sideBarSelected});
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}

/*
* Returns the pilot information page
* @params req{}
* @return Renders view
*/
exports.pilotSearch = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
        return;
    }

    esi.characters.search.strict(req.params.pilotname.replace(/-/g,' ')).then(function (results) { 
        users.findAndReturnUser(Number(results), function(targetUser){
            users.getMain(targetUser.characterID, function(mainAccount){
                if(targetUser && mainAccount) {
                    users.getAlts(targetUser.characterID, function(alts){
                        for(let i = 0; i < mainAccount.notes.length; i++){
                            mainAccount.notes[i].date = new Date(mainAccount.notes[i].date).toDateString();
                        }
                        
                        var userProfile = req.user;
                        targetUser.account.pilots = alts;
                        var sideBarSelected = 6;
                        res.render('toolsPilotSearch.njk', {userProfile, sideBarSelected, targetUser, mainAccount});
                    })
                } else {
                    req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.params.pilotname + " or their main. Have they used our system before?"});
                    res.redirect(`/commander`);                        
                }
            })
        })
    }).catch(function (err) {
        req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.params.pilotname + ". Did you spell your pilot name correctly?"});
        res.redirect(`/commander`);
    })
}

/*
* AJAX Search for the pilot
* @params req{}
* @return res{} url for pilot page || error
*/
exports.searchForPilot = function(req, res){
    if (users.isRoleNumeric(req.user, 1)) {
        esi.characters.search.strict(req.body.search).then(function (results) {
            //ESI cannot find pilot
            if(!results){
                res.status(404).send("ESI Search Fails - No pilot found");
                return;
            }
    
            users.findAndReturnUser(results[0], function(user){
                //ESI finds pilot but they aren't registered
                if(!user){
                    res.status(400).send("Pilot is not registered");
                    return;
                }
                res.status(200).send({"name": user.name, "url": "/c/" + user.name.replace('/s/g', '-').replace(/\s/g, '-') + "/profile"});
            })
            
        })
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}


/*
* Returns a view of the pilots skills
* @params req{}
* @return Renders view
*/
exports.skillsChecker = function(req, res) {
    if(!users.isRoleNumeric(req.user, 1)){
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
        return;
    }
    if(req.params.pilotname === "tools"){
        res.redirect('/c/'+req.user.name.replace(/\s+/g, '-')+'/skills')
        return;
    }
    
    
    esi.characters.search.strict(req.params.pilotname.replace(/-/g,' ')).then(function (results) { 
        users.findAndReturnUser(Number(results), function(targetUser){
            if(targetUser) {
                users.getAlts(targetUser.characterID, function(Alts){
                    var userProfile = req.user;
                    targetUser.account.pilots = Alts;
                    var sideBarSelected = 6;
                    var skillsPackage =  JSON.parse(fs.readFileSync('skills.json', 'utf8'));
                    users.checkSkills(targetUser, skillsPackage, function(skills) {
                        res.render('toolsSkills.njk', {userProfile, sideBarSelected, skills, targetUser});
                    })
                })
            } else {
                log.error("fcTools.skillsChecker: Error for users.findAndReturnUser: ", { name: req.params.pilotname });
                req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.params.pilotname + ". Have they used our system before?"});
                res.redirect(`/commander`);                        
            }
        })
    }).catch(function (err) {
        log.error("fcTools.skillsChecker: Error for esi.characters.search", { err, name: req.params.pilotname });
        req.flash("content", {"class":"error", "title":"Woops!", "message":"We couldn't find " + req.params.pilotname + ". Did you spell your pilot name correctly?"});
        res.redirect(`/commander`);
    })
}

/*
* Returns a log of waitlist actions over the last 7 days
* @params req{}
* @return Renders view
*/
exports.waitlistLog = function(req, res) {
    if(!users.isRoleNumeric(req.user, 1)){
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
        return;
    }
    
    wlog.getWeek(function(logData){
        
        for(var i = 0; i < logData.length; i++){
            let timestamp = logData[i].time;                
            
            month = timestamp.getMonth()+1;
            dt = timestamp.getDate();
            hh = timestamp.getHours();
            mm = timestamp.getMinutes()

            if (dt < 10) {
            dt = '0' + dt;
            }
            if (month < 10) {
            month = '0' + month;
            }
            if (hh < 10) {
                hh = '0' + hh;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            
            logData[i].time = hh + ":" + mm + " " +month + '/' +dt;
        }
        
        var userProfile = req.user;
        var sideBarSelected = 6;
        res.render('waitlistLogs.njk', {userProfile, sideBarSelected, logData});
    });
}


/*
* Sets a logout flag.
* @params req{}
* @return res{status}
*/
exports.logUserOut = function(req, res){
    if(!users.isRoleNumeric(req.user, 5)){
        res.status(401).send("Authentication Required");
        return;
    }

    user.logOut(req.params.pilot, req.user, function(cb){
        res.status(cb).send();
    })
}

/*
* Sets the users new title.
* @params req{}
* @return res{status}
*/
exports.setTitle = function(req, res){
    if(!users.isRoleNumeric(req.user, 5)){
        res.status(401).send("Authentication Required");
        return;
    }

    user.setTitle(req.params.pilot, req.params.title, function(cb){
        res.status(cb).send();
    })
}

/*
* Creates a comment for a pilot
* @params req{}
* @return res{}
*/
exports.addComment = function(req, res){
    if(!users.isRoleNumeric(req.user, 1)){
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
        return;
    }

    users.findAndReturnUser(Number(req.params.pilotID), function(targetUser){
        user.addNote((targetUser.account.main)? targetUser.characterID : targetUser.account.mainID, req.body.comment, (req.body.disciplinary == "on")? true : false, req.user, function(result){
            res.status(result).redirect("/c/"+targetUser.name.replace('/s/g','-')+"/profile");
        })
       
    })
}
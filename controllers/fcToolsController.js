var fs = require('fs');
var esi = require('eve-swagger');
var setup = require('../setup.js');
var users = require('../models/users.js')(setup);
const log = require('../logger.js')(module);
const wlog = require('../models/wlog.js');

//Renders the page for Fit Scanning
exports.fitTool = function(req, res) { 
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
            var userProfile = req.user;
            var sideBarSelected = 6;
            res.render('toolsFits.njk', {userProfile, sideBarSelected});
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}

//Page that allows FCs to check the skills of a pilot
exports.skillsChecker = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
        if(req.params.pilotname !== "tools"){
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
        } else {
            res.redirect('/commander/'+req.user.name.replace(/\s+/g, '-')+'/skills')
        }
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}

exports.waitlistLog = function(req, res) {
    if (req.isAuthenticated() && req.user.roleNumeric > 0) {
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
    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised!", "message":"Only our FC team has access to that page! Think this is an error? Contact a member of leadership."});
        res.status(403).redirect("/");
    }
}
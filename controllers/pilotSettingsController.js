const setup = require('../setup.js');
const user = require('../models/user.js')(setup);
const users = require('../models/users.js')(setup);

//Render Pilot Settings Page
exports.index = function(req, res) {
    if (req.isAuthenticated()) {
        
            var userProfile = req.user;
            var sideBarSelected = 2;
            res.render('pilotSettings.njk', {userProfile, sideBarSelected});

    } else {
        req.flash("content", {"class":"error", "title":"Not Authorised", "message":"You need to be logged in to access this page."});
        res.status(403).redirect("/");
    }
}

/*
* Updates the users jabbername. 
* @params req{}
* @return res{}
*/
exports.jabber = function(req, res){
    if(!users.isRoleNumeric(req.user, 0)){
        res.status(401).redirect("/");
        return;
    }
    
    user.updateJabber((req.user.account.main)? req.user.characterID : req.user.account.mainID, req.body.authName, function(cb){
        res.status(cb).send();
    })
}
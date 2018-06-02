const db = require('./dbHandler.js').db.collection('waitlistlog');
const setup = require('./setup.js');
const users = require('./users.js')(setup);
var wlog = exports.wlog = {};

wlog.joinWl = function(user){
    var logObject = {
        "pilot": {
            "characterID": user.characterID,
            "name": user.name
        },
        "action": "Joined Waitlist",
        "time": new Date().toISOString()
    }
    db.insert(logObject);
}

wlog.selfRemove = function(user){
    var logObject = {
        "pilot": {
            "characterID": user.characterID,
            "name": user.name
        },
        "action": "Self Removed",
        "time": new Date().toISOString()
    }
    db.insert(logObject);
}

wlog.systemRemoved = function(userID){
    users.findAndReturnUser(Number(userID), function(user){
        var logObject = {
            "pilot": {
                "characterID": user.characterID,
                "name": user.name
            },
            "admin": {
                "characterID": null,
                "name": "SYSTEM"
            },
            "action": "Removed from Waitlist",
            "time": new Date().toISOString()
        }
        db.insert(logObject);
    })
}
module.exports = wlog;
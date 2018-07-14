const setup = require('../setup');
const fleets = require('../models/fleets.js')(setup);
const users = require('../models/users.js')(setup);

/*
* Sends an HTML notification to the user
* @params targetID (int), fleetID (int), sender{}, alarmType (sting)
*/
exports.alarm = function(targetID, fleetID, sender, type){   
    fleets.get(fleetID, function(fleet){
        users.findAndReturnUser(Number(targetID), function(user){
            const message = {
                "alarm": sender.name + ' in ' + fleet.comms.name + ' is trying to get your attention.\n\n~~Message for ' + user.name + '~~', 
                "invite": sender.name + ' is trying to invite you to their fleet. Fleet comms: ' + fleet.comms.name + '\n\n~~Message for ' + user.name + '~~'
            }
            //Populate the notification variables
            var notify = setup.browserNotification;
            notify.target = {"id": user.characterID, "name": user.name};
            notify.sender = {"id": sender.characterID, "name":  sender.name};
            notify.comms = {"name": fleet.comms.name, "url": fleet.comms.url};
            notify.message = (type == "alarm")? message.alarm : message.invite;
            //Send the notification package
            const longpoll = require("express-longpoll")(require('express'));
            longpoll.publishToId("/poll/:id", (user.account.main)? user.characterID : user.account.mainID, {
                data: notify
            });
        })
    })    
}
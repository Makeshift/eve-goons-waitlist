const db = require('../dbHandler.js').db.collection('waitlist');
const ObjectId = require('mongodb').ObjectID;
const setup = require('../setup.js');
const user = require('./user.js')(setup);
const log = require('../logger.js')(module);

module.exports = function (setup) {
    var module = {};
    

    /*
    * Adds a pilot to the waitlist
    * @params
    * @return
    */
    module.add = function(waitlistMain, pilot, fits, contact, newbee, cb){
        module.isUserPresent(pilot.characterID, function(result){
            if(result){
                cb({"class": "error", "title": "Woops", "message": pilot.name + " is already on the waitlist."})
                return;
            }

            let waitlist = {
                "waitlistMain": waitlistMain,
                "name": pilot.name,
                "characterID": pilot.characterID,
                "fits": fits,
                "location": {
                    "systemID": null,
                    "name": null
                },
                contact: contact,
                "newbee": newbee,
                "signup": Date.now(),
            }
            
            db.insert(waitlist, function (err) {
                if (err) log.error("waitlist.add: Error for db.insert", { err, name: pilot.name });
                if (!err) cb({"class": "success", "title": "Success", "message": pilot.name + " was added to the waitlist."});
            });
        })
    }

    /*
    * Remove a user from the waitlist
    * @params type (string), characterID (int)
    * @return status
    */
    module.remove = function(type, characterID, cb){
        console.log(type)
        if(type == "all"){
            db.remove({"waitlistMain.characterID": Number(characterID)}, function (err) {
                if (err) {
                    if (err) log.error("waitlist.remove: Error for db.remove", { err, 'character ID': characterID });
                    cb({"class": "error", "title": "Woops!", "message":"We could not remove you from the waitlist!"});
                } else { 
                    cb();
                }
            });
        } else { //Remove alt only
            db.remove({characterID: Number(characterID)}, function (err) {
                if (err) {
                    if (err) log.error("waitlist.remove: Error for db.remove", { err, 'character ID': characterID });
                    cb({"class": "error", "title": "Woops!", "message":"We could not remove you from the waitlist!"});
                } else { 
                    cb();
                }
            });
        }
    }

    /*
    * Checks to see if a user is on the waitlist
    * @params characterID (int)
    * @return bool
    */
    module.isUserPresent = function (characterID, cb) {
		db.findOne({ "characterID": characterID }, function (err, doc) {
			if (err) log.error("waitlist.isUserPresent: Error for db.findOne", { err, 'character ID': characterID });
			if (!!!doc) {
				cb(false)
			} else {
				cb(true);
			}
		})
	}

    /*
    * Returns users position on the waitlist
    * @params characterID (int)
    * @return { position, waitlistSize}
    */
    module.getQueue = function(characterID, cb){
       db.find().sort({ signup: 1 }).toArray(function(err, docs){
            if(err){
                log.error("waitlist.getQueue: ", err)
                cb(null);
                return;
            }
        
            var data = {"position": null, "count": 0}
            for(let i = 0; i < docs.length; i++){
                //Increase waitlist count by one
                if(docs[i].characterID == docs[i].waitlistMain.characterID) data.count ++;
                //Main pilots position
                if(data.position == null && characterID == docs[i].waitlistMain.characterID) data.position = i + 1;
            }
            cb(data)
        })
    }

    module.checkCharsOnWaitlist = function(pilotArray, cb){
        var pilots = [];
        try{
            for(let p = 0; p < pilotArray.length; p++){
                module.isUserPresent(pilotArray[p].characterID, function(onWaitlist){
                    pilots.push({
                        "characterID": pilotArray[p].characterID,
                        "name": pilotArray[p].name,
                        "onWaitlist": onWaitlist
                    })
                    
                    if(pilots.length == pilotArray.length) cb(pilots);
                })
                
            }
        } catch(err){
            cb(null)
        }

    }

    return module;
}
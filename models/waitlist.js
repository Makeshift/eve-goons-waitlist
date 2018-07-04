const db = require('../dbHandler.js').db.collection('waitlist');
const ObjectId = require('mongodb').ObjectID;
const setup = require('../setup.js');
const user = require('./user.js')(setup);
const log = require('../logger.js')(module);

module.exports = function (setup) {
    var module = {};
    
    module.get = function (cb) {
		db.find({}).sort({ "signupTime": 1 }).toArray(function (err, docs) {
			if (err) log.error("get: Error for db.find", { err });
            
            for(let i = 0; i < docs.length; i++){
                var signuptime = Math.floor((Date.now() - docs[i].signup)/1000/60);
                var signupHours = 0;
                while (signuptime > 59) {
                    signuptime -= 60;
                    signupHours++;
                }
                docs[i].signup = signupHours +'H '+signuptime+'M';   
            }
            cb(docs);
		})
	}

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
        if(type == "all"){
            db.remove({"waitlistMain.characterID": Number(characterID)}, function (err) {
                if (err) {
                    if (err) log.error("waitlist.remove: Error for db.remove", { err, 'character ID': characterID });
                    cb({"class": "error", "title": "Woops!", "message":"We could not remove you from the waitlist!"});
                    return;
                } 
                cb({"class": "success", "title": "Success", "message":"We removed you from the waitlist!"});
            });
        } else { //Remove alt only
            db.remove({characterID: Number(characterID)}, function (err) {
                if (err) {
                    if (err) log.error("waitlist.remove: Error for db.remove", { err, 'character ID': characterID });
                    cb({"class": "error", "title": "Woops!", "message":"We could not remove you from the waitlist!"});
                    return;
                }  
                cb({"class": "success", "title": "Success", "message":"We removed your alt the waitlist!"});
            });
        }
    }

    /*
    * Remove a user from the waitlist
    * @params characterID (int)
    * @return status
    */
    module.adminRemove = function(characterID, cb){
        db.remove({characterID: Number(characterID)}, function (err){
            if(err){
                log.error("waitlist.adminRemove: Error removing pilot from the waitlist", {"pilot ID": characterID, err});
                cb(400);
                return;
            }

            cb(200);
        })
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

    /*
    * Returns an array of a users pilots
    * @param [ {characterID, name} ]
    * @return [ {characterID, name, onwaitlist(bool) }]
    */
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

/* Temp Code  =>  MOVE TO THE SCHEDULER */
	module.timers = function () {
		//TODO: Replace this with a proper fleet lookup method that uses the expiry and checks for errors
		//TODO: Error checking doesn't work due to how ESI module handles errors
		setTimeout(lookup, 10*1000)

		function lookup() {
				db.find().forEach(function (doc) {
					//Is user online?
					//Update Location
					user.getLocation(doc, function(location) {
						db.updateOne({ '_id': doc._id }, { $set: { "location": location } }, function (err, result) {
							if (err) log.error("waitlist.getLocation: Error for db.updateOne", { err });
						});
					})
				})
			module.timers();
		}

	}

    return module;
}
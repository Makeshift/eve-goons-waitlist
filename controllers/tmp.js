const setup = require('../setup.js');
const fleets = require('../models/fleets')(setup);
const users = require('../models/users.js')(setup);
const waitlist = require('../models/waitlist.js')(setup);
const db = require('../dbHandler.js').db.collection('waitlist');

/*
* Returns an object of a users known alts (On waitlist or fleet or else)
* @params req{ pilotID (int) }
* @return res{}
*/
exports.pilotStatus = function(characterID, cb){
    var pilotStates = {
        "main": {},
        "other": []
    }

    //Get main
    users.getAlts(Number(characterID), function(knownPilots){
        for(let i = 0; i < knownPilots.length; i++) 
        {
            pilotStates.other.push(knownPilots[i]);
        }
        
        //Flag pilots that are on the wl with their timestamp
        var onWaitlistPromise = [];
        for(let i = 0; i < pilotStates.other.length; i++){
            var promise = new Promise(function(resolve, reject) {
                waitlist.isUserPresent(pilotStates.other[i].characterID, function(timestamp){
                    if(timestamp){
                        resolve(pilotStates.other[i] = {
                            "characterID": pilotStates.other[i].characterID,
                            "name": pilotStates.other[i].name,
                            "onWaitlist": true,
                            "timestamp": timestamp
                        });
                    } else {
                        resolve(pilotStates.other[i] = {
                            "characterID": pilotStates.other[i].characterID,
                            "name": pilotStates.other[i].name,
                            "onWaitlist": false
                        });
                    }
                })
            });
            onWaitlistPromise.push(promise);
        }
        
        
        Promise.all(onWaitlistPromise).then(function(members) {      
            var inFleetPromise = [];
            for(let i = 0; i < pilotStates.other.length; i++){
                var promise = new Promise(function(resolve, reject){
                    if(!pilotStates.other[i].onWaitlist){
                        fleets.inFleet(pilotStates.other[i].characterID, function(inFleet){
                            if(inFleet){
                                resolve(pilotStates.other[i].timestamp = inFleet);
                            } else {
                                resolve();
                            }
                        })
                    } else {
                        resolve();
                    }
                });

                inFleetPromise.push(promise);
            }
            Promise.all(inFleetPromise).then(function(members) {               
                //Sort in order of signup
                pilotStates.other.sort(function(a,b) {
                    if(!!a.timestamp) return 1;
                    if(a.timestamp < b.timestamp) return 1;
                    return -1;
                })
                
                if(!!pilotStates.other[pilotStates.other.length - 1].timestamp)
                    pilotStates.main = pilotStates.other.pop();
                
                //Remove timestamps before passing back the json value.
                pilotStates.other.forEach(function(v){ 
                    delete v.timestamp 
                });

                //Sort by name
                pilotStates.other.sort(function(a,b) {
                    if(a.name > b.name) return 1;
                    return -1;
                })
                
                cb(pilotStates);
            })
        });
    })
}


exports.tmp = function(characterID, cb){
    db.find().sort({ signup: 1 }).toArray(function(err, docs){
        if(err){
            log.error("waitlist.getQueue: ", err)
            cb(null);
            return;
        }
    
        var data = {"mainPos":null, "totalMains": null}
        for(let i = 0; i < docs.length; i++){
            //Number of Mains
            if(docs[i].characterID === docs[i].waitlistMain.characterID) data.totalMains = i;

            //Your position
            if(!data.mainPos && characterID === docs[i].characterID){
                data.mainPos = i;
                continue;
            }
        }

        cb(data);
    });
}
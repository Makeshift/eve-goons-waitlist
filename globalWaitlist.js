var fs = require('fs');
var path = require('path');

module.exports = function(setup) {
    var module = {};
    module.list = [];
    module.createWaitlistVariable = function(cb) {
        try {
            if (module.list.length === 0) {
                fs.readFile(path.normalize(`${__dirname}/${setup.data.directory}/waitlist.json`), function(err, data) {
                    if (typeof data !== 'undefined') {
                        module.list = JSON.parse(data);
                    }
                    cb();
                });
            } else {
                cb()
            }

        } catch (e) {
            console.log("No waitlist found.");
            cb()
        }
    };

    module.addToWaitlist = function(user, cb) {
    	module.checkIfUserIsIn(user.characterID, function(status) {
    		if (!status) {
		    	module.createWaitlistVariable(function() {
			    	module.list.push(user);
			    	module.saveWaitlistData();
			    	cb(true);
			   	})
		   	} else {
		   		cb(true);
		   	}
	   	})
    }

    module.checkIfUserIsIn = function(characterID, cb) {
    	module.createWaitlistVariable(function() {
    		var found = false;
    		for (var i = 0; i < module.list.length; i++) {
    			if (module.list[i].user.characterID == characterID) {
    				found = true;
    				cb(true)
    			}
    		}
    		if (!found) {
    			cb(false);
    		}
    	})
    }

    module.remove = function(characterID, cb) {
    	console.log("Removing " + characterID)
    	module.createWaitlistVariable(function() {
    		for (var i = 0; i < module.list.length; i++) {
    			console.log(`if ${module.list[i].user.characterID} == ${characterID}`)
    			if (module.list[i].user.characterID == characterID) {
    				module.list.splice(i, 1);
    				console.log(module.list);
    				module.saveWaitlistData(module.list);
    				cb();
    				break;
    			}
    		}
    	})
    }

    module.getUserPosition = function(characterID, cb) {
        module.createWaitlistVariable(function() {
            var found = false;
            for (var i = 0; i < module.list.length; i++) {
                if (module.list[i].user.characterID == characterID) {
                    cb({position: i+1, length: module.list.length})
                    found = true;
                }
            }
            if (!found) {
                cb({position: "##", length: "##"})
            }
        })
    }

    module.saveWaitlistData = function(forceData) {
        try {
        	if (forceData) {
        		module.list = forceData;
        	}
            fs.writeFileSync(path.normalize(`${__dirname}/${setup.data.directory}/waitlist.json`), JSON.stringify(module.list, null, 2));
        } catch (e) {
            console.log(e)
            console.log("Failed to save waitlist data");
        }
    };

    return module;
}
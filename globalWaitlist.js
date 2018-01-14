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

    module.get = function(cb) {
        module.createWaitlistVariable(function() {
            cb(module.list);
        })
    }

    module.addToWaitlist = function(user, cb) {
    	module.checkIfUserIsIn(user.characterID, function(status) {
    		if (!status) {
		    	module.createWaitlistVariable(function() {
			    	module.list.push(user);
			    	module.saveWaitlistData(module.list, function() {
                        cb(true);
                    });
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
    	module.createWaitlistVariable(function() {
    		for (var i = 0; i < module.list.length; i++) {
    			if (module.list[i].user.characterID == characterID) {
    				module.list.splice(i, 1);
    				module.saveWaitlistData(module.list, function() {
                        cb();
                    });
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
                    console.log("Waitlist is returning that the player is in it")
                    cb({position: i+1, length: module.list.length}, true, module.list[i].user.name)
                    found = true;
                    break;
                }
            }
            if (!found) {
                cb({position: "##", length: "##"}, false)
            }
        })
    }

    module.saveWaitlistData = function(data, cb) {
        try {
            fs.writeFile(path.normalize(`${__dirname}/${setup.data.directory}/waitlist.json`), JSON.stringify(data, null, 2), function(err) {
                if (err) console.log(err);
                cb();
            });
        } catch (e) {
            console.log(e)
            console.log("Failed to save waitlist data");
        }
    };

    return module;
}
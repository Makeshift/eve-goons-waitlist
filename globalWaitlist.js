const fs = require('fs');
const path = require('path');
const db = require('./dbhandler.js').db.collection('waitlist');
const ObjectId = require('mongodb').ObjectID;

module.exports = function(setup) {
    var module = {};

    module.get = function(cb) {
        db.find({}).toArray(function(err, docs) {
            if (err) console.log(err);
            cb(docs);
        })
    }

    module.getSingleFromTableID = function(id, cb) {
        db.findOne({'_id': ObjectId(id)}, function(err, result) {
            if (err) console.log(err);
            if (typeof cb === "function") cb(result);
        })
    }

    module.addToWaitlist = function(user, cb) {
    	module.checkIfUserIsIn(user.name, function(status) {
    		if (!status) {
                db.insert(user, function(err, doc) {
                    if (err) console.log(err);
                    cb(true);
                })
		   	} else {
		   		cb(true);
		   	}
	   	})
    }

    module.setAsInvited = function(tableID, cb) {
        db.updateOne({'_id': ObjectId(tableID)}, { $set: {"invited": true}}, function(err, result) {
            if (err) console.log(err);
            if (typeof cb === "function") cb();
        })
        
    }

    module.checkIfUserIsIn = function(name, cb) {
            db.findOne({ "name": name}, function(err, doc) {
                if (err) console.log(err);
                if (doc === null) {
                    cb(false)
                } else {
                    cb(true);
                }
            })
    }

    module.remove = function(tableID, cb) {
        console.log("Deleting ID from waitlist: " + tableID);
    	db.deleteOne({ '_id': ObjectId(tableID) }, function(err, result) {
            if (err) console.log(err);
            if (typeof cb === "function") cb();
        })
    }

    module.getUserPosition = function(characterID, cb) {
        db.find({}).sort({ signupTime: 1 }).toArray(function(err, docs) {
            var characterPositions = [];
            for (var i = 0; i < docs.length; i++) {
                if (docs[i].user.characterID == characterID) {
                    characterPositions.push(i + 1);
                }
            }
            if (characterPositions.length === 0) {
                cb({position: "##", length: docs.length}, false);
            } else {
                cb({position: characterPositions, length: docs.length}, false)
            }
        })
        
    }

    module.getCharsOnWaitlist = function(characterID, cb) {
        db.find({"user.characterID": characterID}).toArray(function(err, chars) {
            var charNames = [];
            for (var i = 0; i < chars.length; i++) {
                if (chars[i].alt) {
                    charNames.push(chars[i].alt.name)
                } else {
                    charNames.push(chars[i].user.name);
                }
            }
            cb(charNames);
        })
    }

    return module;

}
const fs = require('fs');
const path = require('path');
const db = require('./dbhandler.js').db.collection('waitlist');

module.exports = function(setup) {
    var module = {};

    module.get = function(cb) {
        db.find({}).toArray(function(err, docs) {
            if (err) console.log(err);
            cb(docs);
        })
    }

    module.addToWaitlist = function(user, cb) {
    	module.checkIfUserIsIn(user.characterID, function(status) {
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

    module.checkIfUserIsIn = function(characterID, cb) {
            db.findOne({ "characterID": characterID}, function(err, doc) {
                if (err) console.log(err);
                if (doc.length === 0) {
                    cb(false)
                } else {
                    cb(true);
                }
            })
    }

    module.remove = function(characterID, cb) {
    	db.deleteOne({ 'characterID': characterID }, function(err, result) {
            if (err) console.log(err);
            cb();
        })
    }

    //TODO: Broken due to mongo. Do we care about the user knowing their position? We don't use it on the FC side really anyway.
    module.getUserPosition = function(characterID, cb) {
        cb({position: "##", length: "##"}, false)
    }
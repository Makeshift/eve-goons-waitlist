const ObjectId = require('mongodb').ObjectID;
const setup = require('./setup.js');
const esi = require('eve-swagger');
const db = require('./dbHandler.js').db.collection('users');
const log = require('./logger.js')(module);

exports.updateUserDB = function(){
    db.find().forEach(function(doc){
        
        //If we don't have a user version aka if it is an old style account
        if(!doc.userVersion){
            esi.corporations.search.strict(doc.corporation.corporation_name).then(function(corpID){
                let mockUser = {
                    "characterID": doc.characterID,
                    "name": doc.name,
                    "alliance": {
                        "allianceID": doc.corporation.alliance_id,
                        "name": doc.alliance.alliance_name,
                    },
                    "corporation": {
                        "corporationID": corpID[0],
                        "name": doc.corporation.corporation_name
                    },
                    "role": {
                        "title": doc.role,
                        "numeric": doc.roleNumeric,
                    },
                    "notes": [],
                    "statistics": {"sites":{}},
                    "account": {
                        "main": true,
                        "linkedCharIDs": [],
                    },
                    "refreshToken": doc.refreshToken,
                    "registrationDate": doc.registrationDate,
                    "userVersion": 2
                }
                db.insert(mockUser, function(err, result){
                    if(err) {
                        console.log(err);
                    } else {
                        db.updateOne({ '_id': ObjectId(doc._id) },{$set: {"userVersion":1}}).then(function(result){
                            console.log("Account updated: " + doc._id)
                        })
                    }
                })
            })
        }
    })
}
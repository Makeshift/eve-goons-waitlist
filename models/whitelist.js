const setup = require('../setup.js');
const ObjectId = require('mongodb').ObjectID;
const db = require('../dbHandler.js').db.collection('whitelist');
const log = require('../logger.js')(module);
//const users = require('./users.js')(setup);

module.exports = function (setup) {  

    /*
    * Returns all active whitelist records
    * @params 
    * @return whitelist
    */
    module.get = function (cb) {
        db.find( { deletedAt: {}}).toArray(function (err, docs) {
            if (err) log.error("whitelist.get: Error for db.find", { err });
            cb(docs);
        })
    }

    /*
    * Add an entity to the whitelist
    * @params data{} (whiteList package)
    * @return cb(error string || null)
    */
    module.store = function (data, cb) {
        module.isAllowed(null, data.id, data.id, function(onWhitelist){
            if(!onWhitelist){
                db.insert(data, function (err) {
                    if (err) log.error("whitelist.store: Error for db.insert", { err, data });
                    cb(null);
                });
            } else {
                cb("Already on the whitelist.");
            }
        })
    }
    
    /*
    * Returns revokes a whitelist record
    * @params ObjectID(whitelistID)
    * @return cb()
    */
    module.revoke = function (whitelistID, cb) {
        db.findOne({'_id': ObjectId(whitelistID)},{$orderby: {"createdAt": -1}}).then(function(doc){
            db.findOneAndUpdate({ '_id': ObjectId(doc._id) }, { $set: { deletedAt: Date.now() } }, function (err) {
                cb(err)
            })
        })
    }

    /*
    * Returns Returns a bool indicating whitelist status.
    * Only one param needs to be passed through
    * @params user{}, corporationID (int), allianceID (int)
    * @return cb(true || false)
    */
    module.isAllowed = function (user, corporationID, allianceID, cb) {
        db.findOne({
            $and : [ {"deletedAt": {}},
                { $or : [ { id : corporationID }, { id : allianceID } ] }]
        }).then(function(doc){
            if(!!doc || user && user.role.numeric > 4){
                cb(true);
            } else {
                cb(false);
            }
        }).catch(function(error){
            debug.warn("whitelist.isAllowed - ", {User: user.name, Error: error})
        })
    }

    return module;
}
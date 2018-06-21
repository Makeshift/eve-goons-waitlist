const db = require('../dbHandler.js').db.collection('waitlist-banner');
const log = require('../logger.js')(module);

module.exports = function (setup) {
    var module = {};

    /*
    * @params: {user}, message_text, message_class
    * @return: cb(status)
    */
    module.createNew = function(user, message_text, message_class, cb){
        var messagePackage = {
            "admin": {
                "character_id": user.character_id,
                "name": user.name
            },
            "class": message_class,
            "text": message_text,
            "created_at": Date.now()
        }
        
        db.insert(messagePackage, function (err, result) {
            if (err) log.error("waitlistBanner.createNew: Error for db.insert", { err });
            cb(200);
            
        })
        cb(400);
    }

    /*
    * @params: void
    * @return: cb(banner || null)
    */
    module.getLast = function(cb){
        db.find({}).sort({created_at: -1}).toArray(function (err, docs) {
			if (err) log.error("waitlistBanner.getLast: Error for db.find", { err });
            if(docs.length > 0 && docs[0].deleted == true){
                cb(null)
            } else {
                cb(docs[0])
            }
		})
    }

    /*
    * @params: _id
    * @return: cb(status)
    */
    module.hideLast = function(cb){
        db.updateMany({}, { $set: { deleted: true} }, function (err, result) {
            if (err) log.error("waitlistBanner.hideLast: Error for db.update", { err });
        })
        
        cb(200);
    }
    return module;
}
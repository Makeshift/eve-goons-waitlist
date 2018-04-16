const db = require('./dbHandler.js').db.collection('waitlist');
const ObjectId = require('mongodb').ObjectID;
const log = require('./logger.js')(module);

module.exports = function globalWaitlist() {
  const module = {};

  module.get = function get(cb) {
    db.find({}).sort({ signupTime: 1 }).toArray((err, docs) => {
      if (err) log.error('get: Error for db.find', { err });
      cb(docs);
    });
  };

  module.getSingleFromTableID = function getSingleFromTableID(id, cb) {
    db.findOne({ _id: ObjectId(id) }, (err, result) => {
      if (err) log.error('getSingleFromTableID: Error for db.findOne', { err, _id: ObjectId(id) });
      if (typeof cb === 'function') cb(result);
    });
  };

  module.addToWaitlist = function addToWaitlist(user, cb) {
    module.checkIfUserIsIn(user.name, function (status) {
      if (!status) {
        db.insert(user, function (err, doc) {
          if (err) {
            log.error("addToWaitlist: Error for db.insert", { err, 'user': user.name });
            cb(400, err);
          } else {
            cb(200, "OK");
          }
        })
      } else {
        cb(200, "OK");
      }
    });
  };

  module.setAsInvited = function setAsInvited(tableID, cb) {
    db.updateOne({ '_id': ObjectId(tableID) }, { $set: { "invited": "invite-sent" } }, function (err, result) {
      if (err) {
        log.error("setAsInvited: Error for db.updateOne", { err, '_id': ObjectId(tableID) });
        cb(400, err)
      } else {
        cb(200, "OK")
      }
    });
  };

  module.checkIfUserIsIn = function checkIfUserIsIn(name, cb) {
    db.findOne({ name }, (err, doc) => {
      if (err) log.error('checkIfUserIsIn: Error for db.findOne', { err, user: name });
      if (doc === null) {
        cb(false);
      } else {
        cb(true);
      }
    });
  };

  module.remove = function remove(tableID, cb) {
    log.debug(`Deleting ID from waitlist: ${tableID}`);
    db.deleteOne({ '_id': ObjectId(tableID) }, function (err, result) {
      if (err) {
        log.error("remove: Error for db.deleteOne", { err, '_id': ObjectId(tableID) });
        cb(400, err);
      } else {
        cb(200, "OK");
      }
    })
  };

  // Temporary - This will delete the first alt it finds on the waitlist, it can be pressed multiple times to remove
  // all of them
  module.selfRemove = function selfRemove(characterID, cb) {
    log.debug(`User removed themselves from waitlist: ${characterID}`);
    db.deleteOne({ 'user.characterID': characterID }, (err) => {
      if (err) log.error('selfRemove: Error for db.deleteOne', { err, characterID });
      if (cb) cb();
    });
  };

  module.getUserPosition = function getUserPosition(characterID, cb) {
    db.find({}).sort({ signupTime: 1 }).toArray((err, docs) => {
      if (err) log.error('getUserPosition: Error for db.find.sort.toArray', { err, characterID });
      const characterPositions = [];
      for (let i = 0; i < docs.length; i++) {
        if (docs[i].user.characterID === characterID) {
          characterPositions.push(i + 1);
        }
      }
      if (characterPositions.length === 0) {
        cb({ position: '##', length: docs.length }, false);
      } else {
        cb({ position: characterPositions, length: docs.length }, false);
      }
    });
  };

  module.getCharsOnWaitlist = function getCharsOnWaitlist(characterID, cb) {
    db.find({ 'user.characterID': characterID }).toArray((err, chars) => {
      if (err) log.error('getCharsOnWaitlist: Error for db.find.toArray', { err, characterID });
      const charNames = [];
      for (let i = 0; i < chars.length; i++) {
        if (chars[i].alt) {
          charNames.push(chars[i].alt.name);
        } else {
          charNames.push(chars[i].user.name);
        }
      }
      cb(charNames);
    });
  };

  return module;
};

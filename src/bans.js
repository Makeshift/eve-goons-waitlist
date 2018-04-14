const db = require('./dbHandler.js').db.collection('bans');
const ObjectId = require('mongodb').ObjectID;
const log = require('./logger.js')(module);

module.exports = function bans() {
  const module = {};
  module.list = [];


  // Register a new ban
  module.register = function registerBan(data, cb) {
    module.checkIfBanned(data.characterID, (res) => {
      if (!res) {
        db.insert(data, (err) => {
          if (err) log.error('bans.register: Error for db.insert', { err, id: data.id });
          if (!err) log.debug('Ban issued', data);
          cb(true);
        });
      } else {
        log.debug(res);
        log.warn(`Ignoring ban ${data.pilotName} is already banned.`);
        cb(true);
      }
    });
  };

  // Returns all active bans
  module.getBans = function getBans(cb) {
    db.find({ deletedAt: {} }).toArray((err, docs) => {
      if (err) log.error('fleet.getFCPageList: Error for db.find', { err });
      cb(docs);
    });
  };

  // Revokes a ban given a ban ID.
  module.revokeBan = function revokeBan(banID, banAdmin, cb) {
    db.updateOne({ _id: ObjectId(banID) }, { $set: { deletedAt: Date.now() } }, (err) => {
      if (err) log.error('module.revokeBan: Error for updateOne', { err, _id: banID });
      if (!err) log.debug(`${banAdmin} revoked ban: ${banID}`);
      if (cb) cb();
    });
  };

  // Return a bool that  if the user is banned.
  module.checkIfBanned = function checkIfBanned(charID, cb) {
    db.find({ deletedAt: {}, characterID: charID }).toArray((err, docs) => {
      if (err) log.error('fleet.getFCPageList: Error for db.find', { err });
      if (docs.length > 0) {
        cb(docs[0]);
      } else {
        cb(false, 'not banned');
      }
    });
  };

  return module;
};

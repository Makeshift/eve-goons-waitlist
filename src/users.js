const setup = require('./setup.js');
const bans = require('./bans.js')(setup);
const refresh = require('passport-oauth2-refresh');
const esi = require('eve-swagger');
const cache = require('./cache.js')(setup);
const db = require('./dbHandler.js').db.collection('users');
const log = require('./logger.js')(module);

const generateNewUser = function generateNewUser(
  refreshToken, characterDetails,
  masterAccount, associatedMasterAccount, cb
) {
  module.getUserDataFromID(characterDetails.CharacterID, (alliance, corporation) => {
    if (alliance && setup.permissions.alliances.includes(alliance.name)) {
      log.debug(`${characterDetails.CharacterName} is in alliance ${alliance.name}`);
      const newUserTemplate = {
        characterID: characterDetails.CharacterID,
        name: characterDetails.CharacterName,
        scopes: characterDetails.Scopes,
        alliance,
        corporation,
        refreshToken,
        role: 'Member',
        roleNumeric: 0,
        registrationDate: new Date(),
        notes: '',
        ships: [],
        relatedChars: [],
        statistics: { sites: {} },
        notifications: [],
        location: { lastCheck: 0 }
      };
      db.insert(newUserTemplate, (err) => {
        if (err) log.error('generateNewUser: Error for db.insert', { err, name: characterDetails.CharacterName });
        cb(newUserTemplate);
      });
    } else {
      const msg = `${characterDetails.CharacterName} is not in a whitelisted alliance 
        (${alliance ? alliance.name : 'null'})`;
      log.warn(msg);
      cb(false, msg);
    }
  });
};

module.exports = function usersModule() {
  const module = {};
  // This nested if stuff is kinda unpleasant and I'd like to fix it
  module.updateUserSession = function updateUserSession(req, res, next) {
    if (typeof req.session.passport === 'undefined' || typeof req.session.passport.user === 'undefined') {
      next();
      return;
    }
    module.findAndReturnUser(req.session.passport.user.characterID, (userData) => {
      if (!userData) {
        req.logout();
        res.redirect('/');
        next();
      } else {
        req.session.passport.user = userData;
        req.session.save((err) => {
          if (err) {
            // TODO: What is user. ?
            // eslint-disable-next-line no-undef
            log.error('updateUserSession: Error for session.save', { err, characterID: user.characterID });
          }
        });

        // check for ban
        bans.checkIfBanned(req.user.characterID, (ban) => {
          if (ban.banType === 'Squad') {
            log.warn(`Logging out banned user: ${req.user.name}`);
            req.logout();
            res.status(418).render('banned.html');
          } else {
            next();
          }
        });
      }
    });
  };

  // Create and manage users - Currently doing this via JSON and saving the object every now and then.
  // TODO: MongoDB with mongoose maybe?
  module.findOrCreateUser = function findOrCreateUser(users, refreshToken, characterDetails, cb) {
    // Check if the user exists
    module.findAndReturnUser(characterDetails.CharacterID, (userProfile) => {
      // We found the user, return it back to the callback
      if (userProfile) {
        log.debug(`Known user ${userProfile.name} has logged in.`);
        cb(userProfile);
      } else {
        // We didn't find the user, create them as a master account
        log.info(`Creating a new user for ${characterDetails.CharacterName}.`);
        generateNewUser(refreshToken, characterDetails, null, null, (userProfile, err) => {
          cb(userProfile, err);
        });
      }
    });
  };

  module.findAndReturnUser = function findAndReturnUser(checkID, cb) {
    db.find({ characterID: checkID }).toArray((err, docs) => {
      if (err) log.error('findAndReturnUser: Error for db.find.toArray', { err, checkID });
      if (docs.length === 0) {
        cb(false);
      } else {
        cb(docs[0]);
      }
    });
  };

  module.deleteUser = function deleteUser(checkID, cb) {
    db.deleteOne({ characterID: checkID }, () => {
      log.info(`A user has been deleted: ${checkID}`);
      if (cb) cb();
    });
  };

  module.updateRefreshToken = function updateRefreshToken(checkID, token) {
    db.updateOne({ characterID: checkID }, { $set: { refreshToken: token } }, (err) => {
      if (err) log.error('updateRefreshToken: Error for updateOne', { err, characterID: checkID });
    });
  };


  module.getLocation = function getLocation(user, cb, passthrough) {
    module.findAndReturnUser(user.characterID, (newUser) => {
      if (Date.now() <= (newUser.location.lastCheck + 30000)) {
        cb(newUser.location, passthrough);
        return;
      }
      refresh.requestNewAccessToken('provider', user.refreshToken, (err, accessToken, newRefreshToken) => {
        if (err) {
          log.error('getLocation: Error for requestNewAccessToken', { err, characterID: user.characterID });
          if (err.data.error.includes('invalid_token')) {
            log.error('requestNewAccessToken has failed due to invalid token, removing them from waitlist.');
            // TODO: what is watlist ?
            // eslint-disable-next-line no-undef
            waitlist.selfRemove(user.characterID);
            module.deleteUser(user.characterID);
            cb({ id: 0, name: 'Unknown', lastCheck: Date.now() });
          }
          cb({ id: 0, name: 'Unknown', lastCheck: Date.now() });
        } else {
          module.updateRefreshToken(user.characterID, newRefreshToken);
          esi.characters(user.characterID, accessToken).location().then((locationResult) => {
            cache.get([locationResult.solar_system_id], (locationName) => {
              const location = {
                id: locationResult.solar_system_id,
                name: locationName.name,
                lastCheck: Date.now()
              };
              cb(location, passthrough);
              db.updateOne({ characterID: user.characterID }, { $set: { location } }, (err) => {
                if (err) {
                  log.error(
                    'getLocation: Error for db.updateOne',
                    { err, characterID: user.characterID, location }
                  );
                }
              });
            });
          }).catch((err) => {
            log.error('users.getLocation: Error for esi.characters', { err, characterID: user.characterID });
          });
        }
      });
    });
  };

  module.getUserDataFromID = function getUserDataFromID(id, cb) {
    esi.characters(id).info().then((data) => {
      const allianceID = data.alliance_id || 0;
      const corporationID = data.corporation_id || 0;
      esi.corporations.names(corporationID).then((corporation) => {
        if (allianceID !== 0) {
          esi.alliances.names(allianceID).then((alliance) => {
            cb(alliance[0], corporation[0]);
          }).catch((err) => {
            log.error('users.getUserDataFromID: Error for esi.alliances.names', { err, userId: id, allianceID });
          });
        } else {
          cb(null, corporation[0]);
        }
      }).catch((err) => {
        log.error('users.getUserDataFromID: Error for esi.corporations.names', { err, userId: id, corporationID });
      });
    }).catch((err) => {
      log.error('users.getUserDataFromID: Error for esi.characters.info', { err, id });
    });
  };

  // Return a list of all users with a permission higher than 0.
  module.getFCList = function getFCList(cb) {
    db.find({ roleNumeric: { $gt: 0 } }).toArray((err, docs) => {
      if (err) log.error('fleet.getFCPageList: Error for db.find', { err });
      cb(docs);
    });
  };

  // Update a users permission and title.
  module.updateUserPermission = function updateUserPermission(characterID, permission, adminUser) {
    const rolesList = ['Member', 'Trainee', '', 'Fleet Commander', '', 'Leadership'];


    // Stop a user from adjusting their own access.
    if (characterID !== adminUser.characterID) {
      db.updateOne(
        { characterID }, { $set: { roleNumeric: Number(permission), role: rolesList[permission] } },
        (err) => {
          if (err) log.error('Error updating user permissions ', { err, characterID });
          if (!err) log.debug(`${adminUser.Name} changed the role of ${characterID} to ${rolesList[permission]}`);
        }
      );
    }
  };

  // Set a users destination
  module.setDestination = function setDestination(user, systemID) {
    refresh.requestNewAccessToken('provider', user.refreshToken, (err, accessToken) => {
      if (err) {
        log.error('module.setDestination: Error for requestNewAccessToken', { err, user });
      }
      // users.updateRefreshToken(user.characterID, newRefreshToken);
      esi.characters(user.characterID, accessToken).autopilot.destination(systemID).catch((err) => {
        log.error('users.setDestination: ', { err });
      });
      log.debug(`Setting ${user.name}'s destination to ${systemID}`);
    });
  };

  // Open the info window of an alliance, corporation or pilot.
  module.showInfo = function showInfo(user, targetID) {
    refresh.requestNewAccessToken('provider', user.refreshToken, (err, accessToken) => {
      if (err) {
        log.error('module.showInfo: Error for requestNewAccessToken', { err, user });
      }
      // users.updateRefreshToken(user.characterID, newRefreshToken);
      esi.characters(user.characterID, accessToken).window.info(targetID).catch((err) => {
        log.error('users.showInfo: ', { err });
      });
      log.debug(`Opening ${targetID}'s information window for ${user.name}`);
    });
  };

  return module;
};

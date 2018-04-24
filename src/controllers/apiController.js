const setup = require('../setup.js');
const cache = require('../cache.js')(setup);
const fleets = require('../fleets.js')(setup);
const users = require('../users.js')(setup);
const log = require('../logger.js')(module);
const api = require('./apiController');

exports.waypoint = function waypoint(req, res) {
  if (req.isAuthenticated() && typeof req.params.systemID !== 'undefined') {
    users.setDestination(req.user, req.params.systemID, (response) => {
      res.send(response);
    });
  }
};

exports.showInfo = function showInfo(req, res) {
  if (req.isAuthenticated && typeof req.params.targetID !== 'undefined') {
    users.showInfo(req.user, req.params.targetID, (response) => {
      res.send(response);
    });
  }
};

// Show the fleet at a glance window.
exports.fleetAtAGlance = function fleetAtAGlance(req, res) {
  fleets.get(req.params.fleetid, (fleet) => {
    if (fleet) {
      const ships = [];

      let counter = 0;
      for (let i = 0; i < fleet.members.length; i++) { // where the fuck is shipID coming from? I'm bad
        cache.get(fleet.members[i].ship_type_id, (ship) => {
          ships.push(ship); // <<<<<
          counter += 1;
          if (counter === fleet.members.length) {
            module.createShipsHTML(ships, req.params.filter, res);
          }
        });
      }
    } else {
      log.debug('No fleet found.');
      res.status(400).send('No fleet found');
    }
  });
};

// Count the total number of each ship and make the table.
module.createShipsHTML = function createShipsHTML(ships, filter, res) {
  const fleet = [];

  while (ships.length > 0) {
    const ship = ships.pop();

    if (fleet[ship.id]) {
      fleet[ship.id].count += 1;
    } else {
      fleet[ship.id] = {
        id: ship.id,
        name: ship.name,
        count: 1
      };
    }
  }

  // Sort by count then name.
  fleet.sort((a, b) => {
    if (a.count < b.count) return 1;
    if (a.name > b.name) return -1;
    return 0;
  });

  const filterShipIDs = setup.fleetCompFilters[filter];

  let count = 1;
  let html = '<table class="table table-striped table-sm"><tbody>';
  fleet.forEach((ship) => {
    if (filterShipIDs === undefined || (filterShipIDs !== undefined && filterShipIDs.includes(fleet[ship].id))) {
      html += `<td class="tw35">
                        <img src="https://image.eveonline.com/Render/${ship.id}_32.png" alt="Ship Icon"></td>
                    <td class="tw20per"><a href="#">${ship.name}</a></td>
                    <td>${ship.count}</td>`;
      if (count % 3 === 0) {
        html += '</tr><tr>';
      }
      count += 1;
    }
  });

  html += '</tbody></table>';

  res.status(200).send(html);
};

exports.alarmUser = function alarmUser(req, res) {
  if (req.isAuthenticated && req.user.roleNumeric > 0) {
    fleets.get(req.params.fleetid, (fleetObject) => {
      const notificationPackage = {
        target: {
          id: req.params.targetid,
          name: null
        },
        sender: {
          id: req.user.characterID,
          name: req.user.name
        },
        comms: {
          name: fleetObject.comms.name,
          url: fleetObject.comms.url
        },
        message: `${req.user.name} is trying to get your attention. Please join them on 
        comms: ${fleetObject.comms.name}`,
        sound: '/includes/alarm.mp3'
      };

      api.sendAlarm(notificationPackage, (result) => {
        if (result === 200) {
          res.status(200).send();
        } else {
          res.status(400).send();
        }
      });
    });
  } else {
    res.status(400).send('Forbidden');
  }
};

// Send notification package to the user
exports.sendAlarm = function sendAlarm(notifyPayload, cb) {
  const notifyPackage = notifyPayload;
  users.findAndReturnUser(Number(notifyPackage.target.id), (userProfile) => {
    notifyPackage.appName = 'Goon Incursion Squad';
    notifyPackage.imgUrl = '/includes/img/gsf-bee.png';
    notifyPackage.target.name = userProfile.name;
    notifyPackage.message = `${notifyPackage.message}\n~~ Notification for: ${notifyPackage.target.name} ~~`;

    const longpoll = require('express-longpoll')(require('express'));
    longpoll.publishToId('/poll/:id', notifyPackage.target.id, {
      data: notifyPackage
    });
  });

  if (typeof cb === 'function') {
    cb(200);
  }
};

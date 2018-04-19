const setup = require('../setup.js');
const fleets = require('../fleets.js')(setup);
const users = require('../users.js')(setup);
const log = require('../logger.js')(module);

const error403Message = `You don't have permission to view this page. If this is in dev, have you edited your data file 
to make your roleNumeric > 4? <br><br><a href='/'>Go back</a>`;

// Render FC Dashboard Page
exports.index = function commanderController(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.getFCPageList((fleets) => {
      if (!fleets) {
        res.status(403).send("No fleets found<br><br><a href='/'>Go back</a>");
        return;
      }

      const userProfile = req.user;
      const sideBarSelected = 5;
      res.render('fcFleetList.njk', { userProfile, sideBarSelected, fleets });
    });
  } else {
    res.status(403).send(error403Message);
  }
};

// Registers a fleet
exports.registerFleet = function registerFleet(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    users.getLocation(req.user, (location) => {
      let fleetid = 0;
      try {
        // eslint-disable-next-line prefer-destructuring
        fleetid = req.body.url.split('fleets/')[1].split('/')[0];
      } catch (e) {
        log.error(e);
      }

      if (!fleetid) {
        res.status(400).send('Fleet ID unable to be parsed. Did you click fleets -> *three buttons at the top left* ' +
          "-> Copy fleet URL?<br><br><a href='/commander/'>Go back</a>");
        return;
      }

      fleets.getMembers(req.user.characterID, req.user.refreshToken, fleetid, null, (members) => {
        if (members === null) {
          log.warn(
            'routes.post /commander/, empty members. Cannot register fleet',
            { fleetid, characterID: req.user.characterID }
          );
          res.status(409).send('Empty fleet or other error <br><br><a href=\'/commander\'>Go back</a>');
          return;
        }
        const fleetInfo = {
          fc: req.user,
          backseat: {},
          type: req.body.type,
          status: 'Not Listed',
          location: location.name,
          members,
          url: req.body.url,
          id: fleetid,
          comms: { name: setup.fleet.comms[0].name, url: setup.fleet.comms[0].url },
          errors: 0
        };
        fleets.register(fleetInfo, (success, errTxt) => {
          if (!success) {
            res.status(409).send(`${errTxt}<br><br><a href='/commander'>Go back</a>`);
          } else {
            res.redirect(302, '/commander/');
          }
        });
      });
    });
  } else {
    res.status(403).send(error403Message);
  }
};

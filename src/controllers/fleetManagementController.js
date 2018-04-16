const setup = require('../setup.js');
const fleets = require('../fleets.js')(setup);
const waitlist = require('../globalWaitlist.js')(setup);

const error403Message = `You don't have permission to view this page. If this is in dev, have you edited your data file
 to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>`;

// Render Fleet Management Page
exports.index = function fleetManagementController(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.get(req.params.fleetid, (fleet) => {
      if (fleet) {
        waitlist.get(function(usersOnWaitlist) {
          //Display the wait time in a nice format.
          for(let i = 0; i < usersOnWaitlist.length; i++) {
            let signuptime = Math.floor((Date.now() - usersOnWaitlist[i].signupTime)/1000/60);
            let signupHours = 0;
            while (signuptime > 59) {
              signuptime -= 60;
              signupHours++;
            }
            usersOnWaitlist[i].signupTime = signupHours +'H '+signuptime+'M';
          }
          let userProfile = req.user;
          let sideBarSelected = 5;
          res.render('fcFleetManage.njk', {userProfile, sideBarSelected, fleet, usersOnWaitlist});
        })
      } else {
        res.status(403).send("Fleet was deleted<br><br><a href='/'>Go back</a>");
      }
      });
  } else {
    res.status(403).send(error403Message);
  }
};

// Invite a pilot to a specific fleet
exports.invitePilot = function invitePilot(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.get(req.params.fleetid, function (fleet) {
      fleets.invite(fleet.fc.characterID, fleet.fc.refreshToken, fleet.id, req.params.characterID, function (status, response) {
        if(status === 200) {
          waitlist.setAsInvited(req.params.tableID, function(invStatus, invResponse) {
            res.status(invStatus).send(invResponse);
          });
        } else {
          res.status(status).send(response)
        }
      });
    })
  } else {
    res.status(403).send(error403Message);
  }
};

// Remove a specific pilot from the waitlist
exports.removePilot = function removePilot(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    waitlist.remove(req.params.tableID, function (status, response) {
      res.status(status).send(response);
    });
  } else {
    res.status(403).send(error403Message);
  }
};

// Update fleet comms.
exports.updateComms = function updateComms(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.updateComms(req.params.fleetid, { name: req.body.name, url: req.body.url }, () => {
      res.redirect(`/commander/${req.params.fleetid}`);
    });
  } else {
    res.status(403).send(error403Message);
  }
};

// Update fleet type
exports.updateType = function updateType(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.updateType(req.params.fleetid, req.body.type, () => {
      res.redirect(`/commander/${req.params.fleetid}`);
    });
  } else {
    res.status(403).send(error403Message);
  }
};

// Update the Fleet Status
exports.updateStatus = function updateStatus(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.updateStatus(req.params.fleetid, req.body.status, () => {
      res.redirect(`/commander/${req.params.fleetid}`);
    });
  } else {
    res.status(403).send(error403Message);
  }
};

// Update the Fleet Commander
exports.updateCommander = function updateCommander(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.updateFC(req.params.fleetid, req.user, () => {
      res.redirect(`/commander/${req.params.fleetid}`);
    });
  } else {
    res.status(403).send(error403Message);
  }
};

// Update the Backseat
exports.updateBackseat = function updateBackseat(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.updateBackseat(req.params.fleetid, req.user, () => {
      res.redirect(`/commander/${req.params.fleetid}`);
    });
  } else {
    res.status(403).send(error403Message);
  }
};

// Close the fleet
exports.closeFleet = function closeFleet(req, res) {
  if (req.isAuthenticated() && req.user.roleNumeric > 0) {
    fleets.delete(req.params.fleetid, () => {
      res.redirect('/commander/');
    });
  } else {
    res.status(403).send(error403Message);
  }
};

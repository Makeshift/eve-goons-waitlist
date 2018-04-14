const express = require('express');

const router = express.Router();
const pagesController = require('./controllers/pagesController.js');
const commanderController = require('./controllers/commanderController.js');
const fleetManagementController = require('./controllers/fleetManagementController.js');
const adminBansController = require('./controllers/adminBansController.js');
const adminFcController = require('./controllers/adminCommandersController.js');

// Index pages & user waitlist functions
router.get('/', pagesController.index);
router.post('/', pagesController.joinWaitlist);
router.get('/remove', pagesController.removeSelf);
router.get('/logout', pagesController.logout);

// Fleets (List and Register)
router.get('/commander', commanderController.index);
router.post('/commander', commanderController.registerFleet);

// FC Waitlist Management
router.get('/commander/:fleetid/', fleetManagementController.index);
router.get('/commander/:fleetid/invite/:characterID/:tableID', fleetManagementController.invitePilot);
router.get('/commander/:fleetid/remove/:tableID', fleetManagementController.removePilot);
router.get('/commander/:fleetid/delete', fleetManagementController.closeFleet);
// TODO: DO VALIDATION ON THIS ENDPOINT
router.post('/commander/:fleetid/update/comms', fleetManagementController.updateComms);
// TODO: DO VALIDATION ON THIS ENDPOINT
router.post('/commander/:fleetid/update/type', fleetManagementController.updateType);
// TODO: DO VALIDATION ON THIS ENDPOINT
router.post('/commander/:fleetid/update/status', fleetManagementController.updateStatus);
// TODO: DO VALIDATION ON THIS ENDPOINT
router.post('/commander/:fleetid/update/commander', fleetManagementController.updateCommander);
// TODO: DO VALIDATION ON THIS ENDPOINT
router.post('/commander/:fleetid/update/backseat', fleetManagementController.updateBackseat);

router.get('/admin/bans', adminBansController.index);
router.post('/admin/bans', adminBansController.createBan);
router.get('/admin/bans/:banID', adminBansController.revokeBan);

router.get('/admin/commanders', adminFcController.index);
router.post('/admin/commanders/update', adminFcController.updateUser);

// Set a users destination
router.get('/esi/ui/waypoint/:systemID', (req, res) => {
  if (req.isAuthenticated() && typeof req.params.systemID !== 'undefined') {
    // TODO: What is users ?
    // eslint-disable-next-line no-undef
    users.setDestination(req.user, req.params.systemID);
  }
  res.redirect('back');
});

// Open the info window of an alliance, corporation or pilot.
router.get('/esi/ui/info/:targetID', (req, res) => {
  if (req.isAuthenticated && typeof req.params.targetID !== 'undefined') {
    // TODO: What is users ?
    // eslint-disable-next-line no-undef
    users.showInfo(req.user, req.params.targetID);
  }
  res.redirect('back');
});

module.exports = router;


/* var exampleUser = {
  avatar: "http://image.eveonline.com/Character/96304094_128.jpg",
  name: "Caitlin Viliana",
  role: "Fleet Commander",
  relatedChars: [{
    avatar: "http://image.eveonline.com/Character/96304094_128.jpg",
    name: "Makeshift Storque",
    registrationDate: "YYYY-MM-DD"
  },{
    avatar: "http://image.eveonline.com/Character/96304094_128.jpg",
    name: "Experianta",
    registrationDate: "YYYY-MM-DD"
  }],
  registrationDate: "YYYY-MM-DD",
  notes: "Is a bit of a wanker",
  ships: [{
    image: "https://image.eveonline.com/Render/17738_32.png",
    name: "Machariel",
    addedOn: "YYYY-MM-DD",
    lastUsed: "5 days ago",
    fit: "[]"
  }, {
    image: "https://image.eveonline.com/Render/17738_32.png",
    name: "Machariel",
    addedOn: "YYYY-MM-DD",
    lastUsed: "10 days ago",
    fit: "[]"
  }],
  statistics: {
    hoursInFleet: 10,
    iskMade: "One beelion dollars",
    noOfDeaths: 2,
    srpRequests: 2,
    kickedFromFleet: 5,
    sites: {
      headquarters: 100,
      assaults: 50,
      vanguards: 5,
      fc: 30
    }
  },
  notifications: [
    {
      text: "Invited to Fleet",
      time: "YYY-MM-DD HH:mm:ss"
    },
    {
      text: "Focus ended: 1DQ1-A",
      time: "YYY-MM-DD HH:mm:ss"
    }
  ]
}; */

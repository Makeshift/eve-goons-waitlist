const express = require('express');

const router = express.Router();
const pagesController = require('./controllers/pagesController.js');
const commanderController = require('./controllers/commanderController.js');
const fleetManagementController = require('./controllers/fleetManagementController.js');
const adminBansController = require('./controllers/adminBansController.js');
const adminFcController = require('./controllers/adminCommandersController.js');
const apiController = require('./controllers/apiController.js');

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
router.post('/commander/:fleetid/invite/:characterID/:tableID', fleetManagementController.invitePilot);
router.post('/commander/:fleetid/remove/:tableID', fleetManagementController.removePilot);
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
router.post('/admin/commanders/trainee', adminFcController.updateUser);

// Interacts with the users client via ESI.
router.post('/esi/ui/waypoint/:systemID', apiController.waypoint);
router.post('/esi/ui/info/:targetID', apiController.showInfo);

// App API endpoints
router.post('/internal-api/fleetcomp/:fleetid/:filter', apiController.fleetAtAGlance);
router.post('/internal-api/alarm-user/:targetid/:fleetid', apiController.alarmUser);
router.post('/internal-api/waitlist/remove-all', fleetManagementController.clearWaitlist);

module.exports = router;


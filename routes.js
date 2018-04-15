var express = require('express');
var router = express.Router();
var pages_controller = require('./controllers/pagesController.js');
var commander_controller = require('./controllers/commanderController.js')
var fleet_management_controller = require('./controllers/fleetManagementController.js')
var admin_bans_controller = require('./controllers/adminBansController.js')
var admin_fcs_controller = require('./controllers/adminCommandersController.js')
var api_controller = require('./controllers/apiController.js')

	//Index pages & user waitlist functions
	router.get('/', pages_controller.index);
	router.post('/', pages_controller.joinWaitlist);
	router.get('/remove', pages_controller.removeSelf);
	router.get('/logout', pages_controller.logout);
	
	//Fleets (List and Register)
	router.get('/commander', commander_controller.index);
	router.post('/commander', commander_controller.registerFleet);

	//FC Waitlist Management
	router.get('/commander/:fleetid/', fleet_management_controller.index);
	router.post('/commander/:fleetid/invite/:characterID/:tableID', fleet_management_controller.invitePilot);
	router.post('/commander/:fleetid/remove/:tableID', fleet_management_controller.removePilot);
	router.get('/commander/:fleetid/delete', fleet_management_controller.closeFleet);
	router.post('/commander/:fleetid/update/comms', fleet_management_controller.updateComms);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/type', fleet_management_controller.updateType);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/status', fleet_management_controller.updateStatus);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/commander', fleet_management_controller.updateCommander);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/backseat', fleet_management_controller.updateBackseat);////TODO: DO VALIDATION ON THIS ENDPOINT

	router.get('/admin/bans', admin_bans_controller.index);
	router.post('/admin/bans', admin_bans_controller.createBan);
	router.get('/admin/bans/:banID', admin_bans_controller.revokeBan);

	router.get('/admin/commanders', admin_fcs_controller.index);
	router.post('/admin/commanders/update', admin_fcs_controller.updateUser);
	router.post('/admin/commanders/trainee', admin_fcs_controller.setTrainee);
	

	//Interacts with the users client via ESI.
	router.post('/esi/ui/waypoint/:systemID', api_controller.waypoint);
	router.post('/esi/ui/info/:targetID', api_controller.showInfo);

	//App API endpoints
	router.post('/internal-api/fleetcomp/:fleetid/:filter', api_controller.fleetAtAGlance);
	module.exports = router;
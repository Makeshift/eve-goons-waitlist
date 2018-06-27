const express = require('express');
const router = express.Router();
const pages_controller = require('./controllers/pagesController.js');
const commander_controller = require('./controllers/commanderController.js');
const fleet_management_controller = require('./controllers/fleetManagementController.js');
const admin_bans_controller = require('./controllers/adminBansController.js');
const admin_fcs_controller = require('./controllers/adminCommandersController.js');
const api_controller = require('./controllers/apiController.js');
const pilot_settings_controller = require('./controllers/pilotSettingsController.js');
const fc_tools_controller = require('./controllers/fcToolsController.js');
const statsController = require('./controllers/statisticsController.js');

	//Index pages & user waitlist functions
	router.get('/', pages_controller.index);
	router.post('/', pages_controller.joinWaitlist);
	router.get('/remove', pages_controller.removeSelf);
	router.get('/logout', pages_controller.logout);
	router.get('/squad-statistics', statsController.index);
	
	//Fleets (List and Register)
	router.get('/commander', commander_controller.index);
	router.post('/commander', commander_controller.registerFleet);

	//FC Waitlist Management
	router.get('/commander/:fleetid/', fleet_management_controller.index);
	router.post('/commander/:fleetid/invite/:characterID/:tableID', fleet_management_controller.invitePilot);
	router.post('/commander/:fleetid/remove/:tableID/:characterID', fleet_management_controller.removePilot);
	router.get('/commander/:fleetid/delete', fleet_management_controller.closeFleet);
	router.post('/commander/:fleetid/update/comms', fleet_management_controller.updateComms);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/type', fleet_management_controller.updateType);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/status', fleet_management_controller.updateStatus);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/commander', fleet_management_controller.updateCommander);//TODO: DO VALIDATION ON THIS ENDPOINT
	router.post('/commander/:fleetid/update/backseat', fleet_management_controller.updateBackseat);////TODO: DO VALIDATION ON THIS ENDPOINT

	//Bans Management
	router.get('/admin/bans', admin_bans_controller.index);
	router.post('/admin/bans', admin_bans_controller.createBan);
	router.get('/admin/bans/:banID', admin_bans_controller.revokeBan);
	//FC Management
	router.get('/admin/commanders', admin_fcs_controller.index);
	router.post('/admin/commanders/update', admin_fcs_controller.updateUser);
	//FC Tools
	router.get('/commander/tools/fits-scan', fc_tools_controller.fitTool);
	router.get('/commander/tools/waitlist-logs', fc_tools_controller.waitlistLog);
	router.get('/commander/:pilotname/skills', fc_tools_controller.skillsChecker);
	
	//Search for pilot
	router.get('/commander/:pilotname/info', fc_tools_controller.pilotSearch);
	router.post('/search', fc_tools_controller.searchForPilot);

	//Pilot Settings
	router.get('/my-settings', pilot_settings_controller.index);
	
	//Interacts with the users client via ESI.
	router.post('/esi/ui/waypoint/:systemID', api_controller.waypoint);
	router.post('/esi/ui/info/:targetID', api_controller.showInfo);
	router.post('/esi/ui/market/:targetID', api_controller.openMarket);

	//App API endpoints
	router.post('/internal-api/fleetcomp/:fleetid/:filter', api_controller.fleetAtAGlance);
	router.post('/internal-api/alarm-user/:targetid/:fleetid', api_controller.alarmUser);
	router.post('/internal-api/waitlist/remove-all', fleet_management_controller.clearWaitlist);
	router.post('/internal-api/banner', api_controller.addBanner);
	router.post('/internal-api/banner/:_id', api_controller.removeBanner);
	
	//External - APIs
	router.get('/api/sstats/members', statsController.getMemberList);
	router.get('/api/sstats/corporations', statsController.getCorporationList);
	router.get('/api/sstats/member-registration', statsController.getMontlySignups);//Todo make object array with monthName and count.

	module.exports = router;
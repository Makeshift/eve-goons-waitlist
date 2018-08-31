const express = require('express');
const router = express.Router();
const commander_controller = require('./controllers/commanderController.js');
const admin_bans_controller = require('./controllers/adminBansController.js');
const admin_fcs_controller = require('./controllers/adminCommandersController.js');
const admin_whitelist_controller = require('./controllers/adminWhitelistController.js');
const api_controller = require('./controllers/apiController.js');
const pilot_settings_controller = require('./controllers/pilotSettingsController.js');
const fc_tools_controller = require('./controllers/fcToolsController.js');
const statsController = require('./controllers/statisticsController.js');
const waitlistController = require('./controllers/waitlistController.js');
const fleetsController = require('./controllers/fleetController.js');

	//Public Pages
	router.get('/', waitlistController.index);
	router.get('/logout', function(req, res){
		req.logout();
		res.status(401).redirect(`/`);
	});

	router.get('/squad-statistics', statsController.index);

	//Waitlist Routes
	router.post('/join/:type', waitlistController.signup);
	router.delete('/remove/:type/:characterID', waitlistController.selfRemove)


	//Pilot Settings
	router.get('/my-settings', pilot_settings_controller.index);
	router.post('/my-settings/jabber', pilot_settings_controller.jabber);

	//Commander - Fleets
	router.get('/c', commander_controller.index);
	router.post('/c', commander_controller.registerFleet);
	router.delete('/c/:fleetID', fleetsController.delete);

	//Commander - FC Waitlist Management
	router.get('/c/:fleetID/', fleetsController.index);
	router.post('/c/:fleetid/update/info', fleetsController.getInfo);	
	router.post('/c/admin/alarm/:characterID/:fleetID', waitlistController.alarm);//501
	router.post('/c/admin/invite/:characterID/:fleetID', fleetsController.invite);
	router.post('/c/admin/remove/:characterID', waitlistController.removePilot);

	//Commander - Fleet Updates
	router.post('/c/:fleetID/update/backseat', fleetsController.updateBackseat);
	router.post('/c/:fleetID/update/commander', fleetsController.updateCommander);
	router.post('/c/:fleetID/update/comms', fleetsController.updateComms);
	router.post('/c/:fleetID/update/type', fleetsController.updateType);
	router.post('/c/:fleetID/update/status', fleetsController.updateStatus);
	

	//Commander - FC Tools
	router.get('/c/tools/fits-scan', fc_tools_controller.fitTool);
	router.get('/c/tools/waitlist-logs', fc_tools_controller.waitlistLog);
	router.get('/c/:pilotname/skills', fc_tools_controller.skillsChecker);
	//Commander - Search for pilot
	router.get('/c/:pilotname/profile', fc_tools_controller.pilotSearch);//View
	router.post('/search', fc_tools_controller.searchForPilot);//ajax search

	router.post('/internal-api/:pilot/logout', fc_tools_controller.logUserOut);
	router.post('/internal-api/:pilot/role/:title', fc_tools_controller.setTitle);
	
	router.post('/c/:pilotID/comment', fc_tools_controller.addComment);//Add a comment

	//Admin - Bans Management
	router.get('/a/bans', admin_bans_controller.index);
	router.post('/a/bans', admin_bans_controller.createBan);
	router.get('/a/bans/:banID', admin_bans_controller.revokeBan);
	//Admin - FC Management
	router.get('/a/commanders', admin_fcs_controller.index);
	router.post('/a/commanders/update', admin_fcs_controller.updateUser);

	//Admin - Whitelist Management
	router.get('/a/whitelist', admin_whitelist_controller.index);
	router.post('/a/whitelist', admin_whitelist_controller.store);
	router.get('/a/whitelist/:whitelistID', admin_whitelist_controller.revoke);
	
	
	//Interacts with the users client via ESI.
	router.post('/esi/ui/waypoint/:systemID', api_controller.waypoint);
	router.post('/esi/ui/info/:targetID', api_controller.showInfo);
	router.post('/esi/ui/market/:targetID', api_controller.openMarket);

	//App API endpoints
	router.post('/internal-api/fleetcomp/:fleetid/:filter', api_controller.fleetAtAGlance);
	router.post('/internal-api/waitlist/remove-all', waitlistController.clearWaitlist);
	router.post('/internal-api/waitlist/pilots/:characterID', waitlistController.pilotStatus);
	router.post('/internal-api/banner', api_controller.addBanner);
	router.post('/internal-api/banner/:_id', api_controller.removeBanner);
	router.post('/internal-api/account/navbar', api_controller.navbar);
	router.post('/internal-api/fleets', fleetsController.getFleetJson);
	router.get('/internal-api/fleet/:fleetID/members', fleetsController.getMembersJson);
	
	//External - APIs
	router.get('/api/sstats/members', statsController.getMemberList);
	router.get('/api/sstats/corporations', statsController.getCorporationList);
	router.get('/api/sstats/member-registration', statsController.getMontlySignups);//Todo make object array with monthName and count.

	module.exports = router;
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
	router.get('/commander', commander_controller.index);
	router.post('/commander', commander_controller.registerFleet);
	router.delete('/commander/:fleetID', fleetsController.delete);

	//Commander - FC Waitlist Management
	router.get('/commander/:fleetID/', fleetsController.index);
	router.post('/commander/:fleetid/update/info', fleetsController.getInfo);	
	router.post('/commander/admin/alarm/:characterID/:fleetID', waitlistController.alarm);//501
	router.post('/commander/admin/invite/:characterID/:fleetID', fleetsController.invite);
	router.post('/commander/admin/remove/:characterID', waitlistController.removePilot);

	//Commander - Fleet Updates
	router.post('/commander/:fleetID/update/backseat', fleetsController.updateBackseat);
	router.post('/commander/:fleetID/update/commander', fleetsController.updateCommander);
	router.post('/commander/:fleetID/update/comms', fleetsController.updateComms);
	router.post('/commander/:fleetID/update/type', fleetsController.updateType);
	router.post('/commander/:fleetID/update/status', fleetsController.updateStatus);
	

	//Commander - FC Tools
	router.get('/commander/tools/fits-scan', fc_tools_controller.fitTool);
	router.get('/commander/tools/waitlist-logs', fc_tools_controller.waitlistLog);
	router.get('/commander/:pilotname/skills', fc_tools_controller.skillsChecker);
	//Commander - Search for pilot
	router.get('/commander/:pilotname/profile', fc_tools_controller.pilotSearch);
	router.post('/search', fc_tools_controller.searchForPilot);//ajax search
	router.post('/internal-api/:pilot/logout', fc_tools_controller.logUserOut);
	router.post('/internal-api/:pilot/role/:title', fc_tools_controller.setTitle);

	//Admin - Bans Management
	router.get('/admin/bans', admin_bans_controller.index);
	router.post('/admin/bans', admin_bans_controller.createBan);
	router.get('/admin/bans/:banID', admin_bans_controller.revokeBan);
	//Admin - FC Management
	router.get('/admin/commanders', admin_fcs_controller.index);
	router.post('/admin/commanders/update', admin_fcs_controller.updateUser);

	//Admin - Whitelist Management
	router.get('/admin/whitelist', admin_whitelist_controller.index);
	router.post('/admin/whitelist', admin_whitelist_controller.store);
	router.get('/admin/whitelist/:whitelistID', admin_whitelist_controller.revoke);
	
	
	//Interacts with the users client via ESI.
	router.post('/esi/ui/waypoint/:systemID', api_controller.waypoint);
	router.post('/esi/ui/info/:targetID', api_controller.showInfo);
	router.post('/esi/ui/market/:targetID', api_controller.openMarket);

	//App API endpoints
	router.post('/internal-api/fleetcomp/:fleetid/:filter', api_controller.fleetAtAGlance);
	router.post('/internal-api/alarm-user/:targetid/:fleetid', api_controller.alarmUser);
	router.post('/internal-api/waitlist/remove-all', waitlistController.clearWaitlist);
	router.post('/internal-api/banner', api_controller.addBanner);
	router.post('/internal-api/banner/:_id', api_controller.removeBanner);
	router.post('/internal-api/account/navbar', api_controller.navbar);
	
	//External - APIs
	router.get('/api/sstats/members', statsController.getMemberList);
	router.get('/api/sstats/corporations', statsController.getCorporationList);
	router.get('/api/sstats/member-registration', statsController.getMontlySignups);//Todo make object array with monthName and count.

	module.exports = router;
var express = require('express');
var router = express.Router();
var pages_controller = require('./controllers/pagesController.js');
var commander_controller = require('./controllers/commanderController.js')
var fleet_management_controller = require('./controllers/fleetManagementController.js')
var admin_bans_controller = require('./controllers/adminBansController.js')
var admin_fcs_controller = require('./controllers/adminCommandersController.js')

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
	router.get('/commander/:fleetid/invite/:characterID/:tableID', fleet_management_controller.invitePilot);
	router.get('/commander/:fleetid/remove/:tableID', fleet_management_controller.removePilot);
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
	
	//Set a users destination
	router.get('/esi/ui/waypoint/:systemID', function(req, res) {
		if (req.isAuthenticated() && typeof req.params.systemID !== "undefined") {
			users.setDestination(req.user, req.params.systemID);
		}
		res.redirect('back');
	})

	//Open the info window of an alliance, corporation or pilot.
	router.get('/esi/ui/info/:targetID', function(req, res) {
		if (req.isAuthenticated && typeof req.params.targetID !== "undefined") {
			users.showInfo(req.user, req.params.targetID);
		}
		res.redirect('back');
	})

	module.exports = router;




		/*var exampleUser = {
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
			 };*/

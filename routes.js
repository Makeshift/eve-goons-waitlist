var template = require('./template.js');
var path = require('path');
var setup = require('./setup.js');
var fleets = require('./fleets.js')(setup);
var users = require('./users.js')(setup);
var esi = require('eve-swagger');
var refresh = require('passport-oauth2-refresh');
var cache = require('./cache.js')(setup);
var waitlist = require('./globalWaitlist.js')(setup);
const log = require('./logger.js');

module.exports = function (app, setup) {
	app.get('/', function (req, res) {
		if (req.isAuthenticated()) {
			//Grab all fleets
			fleets.getFCPageList(function (fleets) {
				if (!fleets) {
					res.status(403).send("No fleets found<br><br><a href='/'>Go back</a>");
					return;
				}
				var page = {
					template: "publicWaitlist",
					sidebar: {
						selected: 1,
						user: req.user
					},
					header: {
						user: req.user
					},
					content: {
						user: req.user,
						fleets: fleets
					}
				}
				template.pageGenerate(page, function (generatedPage) {
					res.send(generatedPage);
				})
			});
		} else {
			res.sendFile(path.normalize(`${__dirname}/public/index.html`));
		}
	});

	app.post('/', function (req, res) {
		if (req.isAuthenticated()) {
			var alt = false;
			if (req.user.name != req.body.name) {
				esi.characters.search.strict(req.body.name).then(function (results) {
					//This can be a user later
					alt = {
						name: req.body.name,
						id: results[0],
						avatar: "http://image.eveonline.com/Character/" + results[0] + "_128.jpg"
					};
					submitAddition();
				}).catch(function (err) {
					log.error("routes.post: Error for esi.characters.search", { err, name: req.body.name });
					res.redirect(`/?err=Some error happened! Does that character exist? (DEBUG: || ${err.toString().split("\n")[0]} || ${err.toString().split("\n")[1]} || < Show this to Makeshift!`);
				})
			} else {
				submitAddition();
			}

			function submitAddition() { //Functionception
				var userAdd = {
					name: req.body.name,
					alt: alt,
					user: req.user,
					ship: req.body.ship,
					signupTime: Date.now()
				}
				waitlist.addToWaitlist(userAdd, function () {
					res.redirect(`/?info=Character ${req.body.name} added to waitlist.`);
				});
			}
		}
	});

	app.get('/remove', function (req, res) {
		if (req.isAuthenticated()) {
			waitlist.remove(req.user.characterID, function () {
				res.redirect('/')
			})
		}
	})

	app.get('/logout', function (req, res) {
		req.logout();
		res.redirect('/');
	});

	/*app.get('/waitlist', function (req, res) {
		if (req.isAuthenticated()) {
			res.send(JSON.stringify(req.user, null, 4) + "<br><br><a href='/logout'>Log out</a>");
		} else {
			res.redirect('/');
		}
	});*/

	app.get('/commander/', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			fleets.getFCPageList(function (fleets) {
				if (!fleets) {
					res.status(403).send("No fleets found<br><br><a href='/'>Go back</a>");
					return;
				}
				var page = {
					template: "fcFleetList",
					sidebar: {
						selected: 5,
						user: req.user
					},
					header: {
						user: req.user
					},
					content: {
						user: req.user,
						fleets: fleets
					}
				}
				template.pageGenerate(page, function (generatedPage) {
					res.send(generatedPage);
				})
			})
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	});


	app.post('/commander/', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			users.getLocation(req.user, function (location) {
				var fleetid = 0;
				try {
					fleetid = req.body.url.split("fleets/")[1].split("/")[0];
				} catch (e) { }

				if (!fleetid) {
					res.status(400).send("Fleet ID unable to be parsed. Did you click fleets -> *three buttons at the top left* -> Copy fleet URL?<br><br><a href='/commander/'>Go back</a>")
					return;
				}

				fleets.getMembers(req.user.characterID, req.user.refreshToken, fleetid, null, function (members) {
					if (members===null) {
						log.warn('routes.post /commander/, empty members. Cannot register fleet', { fleetid, characterID: req.user.characterID });
						res.status(409).send("Empty fleet or other error" + "<br><br><a href='/commander'>Go back</a>")
						return;
					}
					var fleetInfo = {
						fc: req.user,
						backseat: {},
						type: req.body.type,
						status: "Forming",
						location: location.name,
						members: members,
						url: req.body.url,
						id: fleetid,
						comms: { name: setup.fleet.comms[0].name, url: setup.fleet.comms[0].url },
						errors: 0
					}
					fleets.register(fleetInfo, function (success, errTxt) {
						if (!success) {
							res.status(409).send(errTxt + "<br><br><a href='/commander'>Go back</a>")
						} else {
							res.redirect(302, '/commander/')
						}
					});
				})
			})

		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	});

	app.get('/commander/:fleetid/', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			fleets.get(req.params.fleetid, function (fleet) {
				if (!fleet) {
					res.status(403).send("Fleet was deleted<br><br><a href='/'>Go back</a>");
					return;
				}
				var page = {
					template: "fcFleetManage",
					sidebar: {
						selected: 5,
						user: req.user
					},
					header: {
						user: req.user
					},
					content: {
						user: req.user,
						fleet: fleet
					}
				}
				template.pageGenerate(page, function (generatedPage) {
					res.send(generatedPage);
				})
			})
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	});

	app.get('/commander/:fleetid/invite/:characterID/:tableID', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			fleets.get(req.params.fleetid, function (fleet) {
				fleets.invite(fleet.fc.characterID, fleet.fc.refreshToken, fleet.id, req.params.characterID, function () {
					res.redirect(302, '/commander/' + req.params.fleetid);
				});
				waitlist.setAsInvited(req.params.tableID);
			})

		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	});

	app.get('/commander/:fleetid/remove/:tableID', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			waitlist.remove(req.params.tableID, function () {
				res.redirect(302, '/commander/' + req.params.fleetid);
			});
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	})

	app.get('/commander/:fleetid/delete', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			fleets.delete(req.params.fleetid, function () {
				res.redirect('/commander/');
			});
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}

	})
	//TODO: DO VALIDATION ON THIS ENDPOINT
	app.post('/commander/:fleetid/update/comms', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			fleets.updateComms(req.params.fleetid, { name: req.body.name, url: req.body.url }, function () {
				res.redirect('/commander/' + req.params.fleetid);
			})
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	})

	//TODO: DO VALIDATION ON THIS ENDPOINT
	app.post('/commander/:fleetid/update/type', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			fleets.updateType(req.params.fleetid, req.body.type, function () {
				res.redirect('/commander/' + req.params.fleetid);
			})
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	})

	//TODO: DO VALIDATION ON THIS ENDPOINT
	app.post('/commander/:fleetid/update/status', function (req, res) {
		if (req.isAuthenticated() && req.user.roleNumeric > 0) {
			fleets.updateStatus(req.params.fleetid, req.body.status, function () {
				res.redirect('/commander/' + req.params.fleetid);
			})
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	})











}



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
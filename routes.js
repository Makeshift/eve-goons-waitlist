var template = require('./template.js');
var path = require('path');
var setup = require('./setup.js');
var fleets = require('./fleets.js')(setup);
var users = require('./users.js')(setup);
var esi = require('eve-swagger');
var refresh = require('passport-oauth2-refresh');
var cache = require('./cache.js')(setup);

module.exports = function(app, setup) {
	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
			//Since the user is at the index, let's force an update of their session, just in case
			users.findAndReturnUser(req.user.characterID, function(userProfile) {
				req.session.passport.user = userProfile;
				req.session.save(function(err) {

					if (err) console.log(err);
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
						 user: req.user
					  }
					}
					res.send(template.pageGenerate(page));
				})
			})
		} else {
			res.sendFile(path.normalize(`${__dirname}/public/index.html`));
		}
	});

	app.get('/logout', function(req, res) {
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
			fleets.getFCPageList(function(fleets) {
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
				res.send(template.pageGenerate(page));
			})
		} else {
			res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
		}
	});


app.post('/commander/', function(req, res) {
	if (req.isAuthenticated() && req.user.roleNumeric > 0) {
		refresh.requestNewAccessToken('provider', req.user.refreshToken, function(err, accessToken, newRefreshToken) {
			users.updateRefreshToken(req.user.characterID, newRefreshToken);
			console.log(err)
			console.log(accessToken)
			console.log(newRefreshToken)
			esi.characters(req.user.characterID, accessToken).location().then(function(locationResult) {
				cache.get([locationResult.solar_system_id], function(locationName) {
					var fleetid = req.body.url.split("fleets/")[1].split("/")[0];
					esi.characters(req.user.characterID, accessToken).fleet(fleetid).members().then(function(members) {
						var fleetInfo = {
							fc: req.user,
							backseat: {},
							type: req.body.type,
							status: "Forming",
							location: locationName,
							members: members,
							url: req.body.url,
							id: fleetid,
							comms: "Incursions -> A"
						}
						console.log(fleetInfo);
						fleets.register(fleetInfo);
						res.redirect(302, '/commander/')
						})
					
				})
			})
			
		})
	} else {
		res.status(403).send("You don't have permission to view this page. If this is in dev, have you edited your data file to make your roleNumeric > 0? <br><br><a href='/'>Go back</a>");
	}
});

app.get('/commander/:fleetid/', function(req, res) {
	if (req.isAuthenticated() && req.user.roleNumeric > 0) {
		res.send(req.params.fleetid)
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
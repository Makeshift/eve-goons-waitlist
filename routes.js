var template = require('./template.js');
var path = require('path');
var fleets = require('./fleets.js');

module.exports = function(app, setup) {
	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
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
				 fleets: fleets.getFCPageList()
			  }
			}
			res.send(template.pageGenerate(page));
		} else {
			res.redirect('/');
		}
	});
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
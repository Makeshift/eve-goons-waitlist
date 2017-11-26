module.exports = function(app, setup) {
	app.get('/', function(req, res) {
		var s = "/";
		if (setup.data.isWin) {
			s = "\\";
		}
		if (req.isAuthenticated()) {
			res.redirect('/waitlist');
		} else {
			res.sendFile(`${__dirname}${s}public${s}index.html`)
		}
	});

	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/waitlist', function (req, res) {
		if (req.isAuthenticated()) {
			res.send(JSON.stringify(req.user, null, 4) + "<br><br><a href='/logout'>Log out</a>");
		} else {
			res.redirect('/');
		}
	});

}
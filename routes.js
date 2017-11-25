module.exports = function(app) {
	app.get('/', function(req, res) {
		if (req.isAuthenticated()) {
			res.redirect('/waitlist');
		} else {
			res.send(`Log in with <a href="/auth/provider">Eve Online</a>.`)
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
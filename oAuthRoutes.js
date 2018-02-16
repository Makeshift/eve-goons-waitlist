module.exports = function(app, passport, setup) {
	// Redirect the user to the OAuth 2.0 provider for authentication.  When
	// complete, the provider will redirect the user back to the application at
	//     /auth/provider/callback
	app.get('/auth/provider',
	    passport.authenticate('provider', {
	        scope: setup.oauth.scopes
	    })
	);

	// The OAuth 2.0 provider has redirected the user back to the application.
	// Finish the authentication process by attempting to obtain an access
	// token.  If authorization was granted, the user will be logged in.
	// Otherwise, authentication has failed.
	app.get('/auth/provider/callback',
	  passport.authenticate('provider', { successRedirect: '/',
	                                      failureRedirect: '/failedLoginCallback' }));
	//Some error handling endpoints
	app.get('/failedLoginCallback', function(req, res) {
		res.send("We tried to get a new token for you but we failed at the callback stage. This indicates that there's either an issue with the SSO service, or your character is not authorized to use this application.<br><br>You may be trying to login with the wrong character. Click <a href='/'>here</a> to go back and try to login with a character in a whitelisted alliance.")
	});
	app.get('/failedLoginAuth', function(req, res) {
		res.send("You failed to authorize at the login stage. This means your session has probably expired and you need to log in again.")
	});
}
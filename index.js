
// mandatory setup.js
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
if (!fs.existsSync(path.normalize(__dirname + "/setup.js"))) {
	throw "You need to create a setup.js file. Refer to the readme."
}

const setup = require('./setup.js');
const log = require('./logger.js')(module);
const database = require('./dbHandler.js');

//Apparently JS has a shit fit when it can't throw errors properly so uh, we need to make it throw errors properly
process.on('uncaughtException', function(exception) {
	console.log(exception);
})
process.setMaxListeners(0);

database.connect(function () {
	const db = database.db;
	const express = require('express');
	const passport = require('passport');
	const app = express();
	const OAuth2Strategy = require('passport-oauth2');
	const refresh = require('passport-oauth2-refresh');
	const bodyParser = require('body-parser');
	const request = require('request');
	const url = require('url');
	const session = require('express-session');
	const mongoStore = require('connect-mongo')(session);
	const cookieParser = require('cookie-parser');
	const flash = require('req-flash');

	//Custom imports

	const users = require('./models/users.js')(setup);
	const customSSO = require('./customSSO.js')(refresh, setup, request, url);
	const fleets = require('./models/fleets.js')(setup);
	const waitlist = require('./models/waitlist.js')(setup);

	//Start timers
	fleets.timers();
	waitlist.timers();

	//Configure Passport's oAuth
	var oauthStrategy = new OAuth2Strategy({
			authorizationURL: `https://${setup.oauth.baseSSOUrl}/oauth/authorize`,
			tokenURL: `https://${setup.oauth.baseSSOUrl}/oauth/token`,
			clientID: setup.oauth.clientID,
			clientSecret: setup.oauth.secretKey,
			callbackURL: setup.oauth.callbackURL,
			passReqToCallback: true
		},
		function (req, accessToken, refreshToken, profile, done) {
			//Get Character Details
			customSSO.verifyReturnCharacterDetails(refreshToken, function (success, response, characterDetails) {
				if (success) {
					users.findOrCreateUser(users, refreshToken, characterDetails, function (user, err) {
						if(req.isAuthenticated())
						{	
							//Link the alt to the users main account
							users.linkPilots(req.user, characterDetails, function(result){
								req.flash("content", {"class": result.type, "title":"Account Linked", "message": result.message});
								done(null, req.user);
							})
						} else {
							//Normal login flow  - Log them in.
							if (user === false) {
								done(err);
							} else {
								done(null, user);
							}
						}
						
					})
				} else {
					log.info(`Character ID request failed for token ${refreshToken}`);
					done(success);
				}
			});
		});

	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	passport.deserializeUser(function (user, done) {
		done(null, user);
	});

	//Extend some stuff
	passport.use('provider', oauthStrategy);
	refresh.use('provider', oauthStrategy);
	app.use(session({
		store: new mongoStore({ db: database.db }),
		secret: setup.data.sessionSecret,
		cookie: { maxAge: 604800 * 1000 }, //Week long cookies for week long incursions!
    resave: true,
    saveUninitialized: true
	}))

	app.use(cookieParser());
	app.use(session({ secret: setup.data.sessionSecret }));
	app.use(flash({ locals: 'flash' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(bodyParser.urlencoded({ extended: true }));
			
	/* Middleware Checks */
	app.use('/includes', express.static('public/includes'));//Exempt
	app.use(require('./middleware/userSession.js')(setup).refresh);
	app.use(require('./middleware/ban.js')(setup).check);
	app.use(require('./middleware/whitelist.js')(setup).check);
	app.use(require('./middleware/logout.js')(setup).check);

	nunjucks.configure('resources/views', {
		autoescape: true,
		express: app
	});

	//Routes
	require('./oAuthRoutes.js')(app, passport, setup);
	var routeListen = require('./routes.js');
	app.use(routeListen)

	//Longpolling
	const longpoll = require("express-longpoll")(app, {
		DEBUG: false,
	});
	//Create longpoll routes
	longpoll.create("/poll/:id", (req, res, next) => {
		req.id = req.params.id;
		next();
	});	

	//Configure Express webserver
	app.listen(setup.settings.port, function listening() {
		log.info('Express online and accepting connections');
	});
});
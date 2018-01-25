//Imports
const express = require('express');
const passport = require('passport');
const app = express();
const OAuth2Strategy = require('passport-oauth2');
const refresh = require('passport-oauth2-refresh');
const bodyParser = require('body-parser');
const request = require('request');
const url = require('url');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const mongoStore = require('connect-mongo')(session);

//Custom imports
if (!fs.existsSync(path.normalize(__dirname + "/setup.js"))) {
    throw "You need to create a setup.js file. Refer to the readme."
}
const setup = require('./setup.js');
const users = require('./users.js')(setup);
const customSSO = require('./customSSO.js')(refresh, setup, request, url);
const fleets = require('./fleets.js')(setup);
const database = require('./dbhandler.js');



//Make the data folder
if (!fs.existsSync(path.normalize(__dirname + "/" + setup.data.directory))) {
    console.log("Creating data folder");
    fs.mkdirSync(path.normalize(__dirname + "/" + setup.data.directory))
}

users.createUsersVariable(function() { //This is legacy and will be removed shortly
    //Initialise Mongo
    database.connect(function() {
        //Start timers
        fleets.timers();

        //Configure Passport's oAuth
        var oauthStrategy = new OAuth2Strategy({
                authorizationURL: `https://${setup.oauth.baseSSOUrl}/oauth/authorize`,
                tokenURL: `https://${setup.oauth.baseSSOUrl}/oauth/token`,
                clientID: setup.oauth.clientID,
                clientSecret: setup.oauth.secretKey,
                callbackURL: setup.oauth.callbackURL
            },
            function(accessToken, refreshToken, profile, done) {
            	console.log("Users access token: " + accessToken);
            	console.log("Users refresh token: " + refreshToken);
            	//Our user has logged in, let's get a unique ID for them (Their character ID, because why not)
            	customSSO.verifyReturnCharacterDetails(refreshToken, function(success, response, characterDetails) {
            		if (success) {
            			users.findOrCreateUser(users, refreshToken, characterDetails, function(user) {
            				done(null, user);
            			})
            			
            		} else {
            			console.log("Character ID request failed for token " + refreshToken);
            			done(success);
            		}
            	});
            });

        passport.serializeUser(function(user, done) {
          done(null, user);
        });

        passport.deserializeUser(function(user, done) {
          done(null, user);
        });

        //Extend some stuff
        passport.use('provider', oauthStrategy);
        refresh.use('provider', oauthStrategy);
        app.use(session({
            store: new mongoStore({ db: database.db}),
            secret: setup.data.sessionSecret,
            cookie: { maxAge: 604800*1000 } //Week long cookies for week long incursions!
        }))
        app.use(passport.initialize());
        app.use(passport.session());
        app.use( bodyParser.urlencoded({ extended: true }) );
        app.use('/includes', express.static('public/includes'));

        //Routes
        require('./oAuthRoutes.js')(app, passport, setup);
        require('./routes.js')(app, setup);

        //Configure Express webserver
        app.listen(setup.settings.port, function listening() {
            console.log('Express online and accepting connections');
        });
    })
});
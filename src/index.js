// mandatory setup.js
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

if (!fs.existsSync(path.normalize(`${__dirname}/setup.js`))) {
  throw new Error('You need to create a setup.js file. Refer to the readme.');
}

const setup = require('./setup.js');
const log = require('./logger.js')(module);
const database = require('./dbHandler.js');

database.connect(() => {
  const express = require('express');
  const passport = require('passport');
  const app = express();
  const OAuth2Strategy = require('passport-oauth2');
  const refresh = require('passport-oauth2-refresh');
  const bodyParser = require('body-parser');
  const request = require('request');
  const url = require('url');
  const session = require('express-session');
  const MongoStore = require('connect-mongo')(session);

  // Custom imports

  const users = require('./users.js')(setup);
  const customSSO = require('./customSSO.js')(refresh, setup, request, url);
  const fleets = require('./fleets.js')(setup);

  // Start timers
  fleets.timers();

  // Configure Passport's oAuth
  const oauthStrategy = new OAuth2Strategy(
    {
      authorizationURL: `https://${setup.oauth.baseSSOUrl}/oauth/authorize`,
      tokenURL: `https://${setup.oauth.baseSSOUrl}/oauth/token`,
      clientID: setup.oauth.clientID,
      clientSecret: setup.oauth.secretKey,
      callbackURL: setup.oauth.callbackURL
    },
    ((accessToken, refreshToken, profile, done) => {
    // Our user has logged in, let's get a unique ID for them (Their character ID, because why not)
      customSSO.verifyReturnCharacterDetails(refreshToken, (success, response, characterDetails) => {
        if (success) {
          users.findOrCreateUser(users, refreshToken, characterDetails, (user, err) => {
            if (user === false) {
              done(err);
            } else {
              done(null, user);
            }
          });
        } else {
          log.info(`Character ID request failed for token ${refreshToken}`);
          done(success);
        }
      });
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Extend some stuff
  passport.use('provider', oauthStrategy);
  refresh.use('provider', oauthStrategy);
  app.use(session({
    store: new MongoStore({ db: database.db }),
    secret: setup.data.sessionSecret,
    cookie: { maxAge: 604800 * 1000 }, // Week long cookies for week long incursions!
    resave: true,
    saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/includes', express.static('public/includes'));
  app.use(users.updateUserSession); // Force the session to update from DB on every page load because sessions are not
  // the source of truth here!

  nunjucks.configure('src/views', {
    autoescape: true,
    express: app
  });

  // Routes
  require('./oAuthRoutes.js')(app, passport, setup);
  const routeListen = require('./routes.js');
  app.use(routeListen);

  // Longpolling
  const longpoll = require('express-longpoll')(app, {
    DEBUG: false,
  });
  // Create longpoll routes
  longpoll.create('/poll/:id', (req, res, next) => {
    req.id = req.params.id;
    next();
  });

  // Configure Express webserver
  app.listen(setup.settings.port, () => {
    log.info('Express online and accepting connections');
  });
});

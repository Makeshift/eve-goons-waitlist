# eve-goons-waitlist
The ESI-enabled socket-based waitlist used by the Incursions squad in Goonfleet of Eve Online.

### Installation and Setup
* Clone repo
* Run `npm install` to grab dependencies
* Install a MongoDB instance
* Create a `setup.js` file using the template below.

Setup.js:
```
exports.oauth = {
	clientID: "YourDeveloperAppIDHere",
	secretKey: "YourSecretKeyHere",
	callbackURL: "http://<callbackURL>/auth/provider/callback",
	scopes: ['publicData','esi-location.read_location.v1','esi-location.read_ship_type.v1','esi-skills.read_skills.v1','esi-skills.read_skillqueue.v1','esi-wallet.read_character_wallet.v1','esi-killmails.read_killmails.v1','esi-assets.read_assets.v1','esi-fleets.read_fleet.v1','esi-fleets.write_fleet.v1','esi-ui.write_waypoint.v1','esi-fittings.read_fittings.v1','esi-location.read_online.v1','esi-clones.read_implants.v1','esi-characters.read_fatigue.v1'],
	userAgent: 'express 4.9.5, eve-sso, goons-incursionauth 2.0.0',
	baseSSOUrl: "login.eveonline.com"
};

exports.data = {
	directory: "data", //Where data will be stored
	sessionSecret: "RandomStringHere",
	mongoDbURL: "mongoDB://localhost:27017",
	mongoDbName: "eve-goons-waitlist"
}

exports.settings = {
	port: 80
}

exports.permissions = {
	"alliances": ["Alliance 1", "Alliance 2"], //Whitelisted Alliances
	"admins": ["Player 1", "Player 2"], //FC's
	"leadership": ["Player 3", "Player 1"], //Can manage FC's
	"blacklist": ["Player 5"] //Banned
}
```
Many of the variables can be populated from here: https://developers.eveonline.com/

* Run with `node index.js`.
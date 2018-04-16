# eve-goons-waitlist
The ESI-enabled socket-based waitlist used by the Incursions squad in Goonfleet of Eve Online.

### Installation and Setup
* Clone repo
* Run `npm install` to grab dependencies
* Install a MongoDB instance
* Create a `setup.js` file using the template below.

setup.js:
```
exports.oauth = {
	clientID: "YourDeveloperAppIDHere",
	secretKey: "YourSecretKeyHere",
	callbackURL: "http://<callbackURL>/auth/provider/callback",
	scopes: ['publicData','esi-location.read_location.v1','esi-location.read_ship_type.v1','esi-skills.read_skills.v1','esi-skills.read_skillqueue.v1','esi-wallet.read_character_wallet.v1','esi-killmails.read_killmails.v1','esi-assets.read_assets.v1','esi-fleets.read_fleet.v1','esi-fleets.write_fleet.v1','esi-ui.open_window.v1','esi-ui.write_waypoint.v1','esi-fittings.read_fittings.v1','esi-location.read_online.v1','esi-clones.read_implants.v1','esi-characters.read_fatigue.v1'],
	userAgent: 'express 4.9.5, eve-sso, goons-incursionauth 2.0.0',
	baseSSOUrl: "login.eveonline.com"
};

exports.data = {
	directory: "data", //Where data will be stored
	sessionSecret: "RandomStringHere",
	mongoDbURL: "mongoDB://localhost:27017",
	mongoDbName: "eve-goons-waitlist"
}

exports.fleet = {
	comms: [{
		name: "Incursions -> A",
		url: "mumble://mumble.goonfleet.com/Squads%20and%20SIGs/Incursions/Fleet%20A?title=Goonfleet&version=1.2.0"
	},{
		name: "Incursions -> B",
		url: "mumble://mumble.goonfleet.com/Squads%20and%20SIGs/Incursions/Fleet%20B?title=Goonfleet&version=1.2.0" 
	},{
		name: "Incursions -> C",
		url: "mumble://mumble.goonfleet.com/Squads%20and%20SIGs/Incursions/Fleet%20C?title=Goonfleet&version=1.2.0"
	},{
		name: "Incursions -> D",
		url: "mumble://mumble.goonfleet.com/Squads%20and%20SIGs/Incursions/Fleet%20D?title=Goonfleet&version=1.2.0"
	},]
}

exports.settings = {
	port: 80
}

exports.permissions = {
	"alliances": ["Alliance 1", "Alliance 2"] //Whitelisted Alliances
}

//roleNumeric titles, use null to disable. Leave index0 as member
exports.userPermissions =  ["Member", "Trainee", null, "Fleet Commander", "Senior FC", "Leadership"];

exports.fleetCompFilters = {
	logi: [11987,11989,22474,22442],//Guardian, Oneiros, Damnation, Eos
	caps: [23757,37604,23915,37605,23911,37607,24483,37606,42242,45645],//Archon, Apostle, Chimera, Minokawa, Thanatos, Ninazu, Nidhoggur, Lif, Dagon, Loggerhead
	supers: [23919,11567,23917,3764,23913,671,22852,23773,42241,3514,42125,42126,45649]//Aeon, Avatar, Wyvern, Leviathan, Nyx, Erebus, Hel, Ragnarok, Molok, Revenant, Vendetta, Vanquisher, Komodo
}
```
Many of the variables can be populated from here: https://developers.eveonline.com/

* Run with `node index.js`.

### Development with Docker

Setup your [docker environment](https://docs.docker.com/machine/get-started/)  

Create a 'data' directory in the root of the repository
In your setup.js point mongoDbURL to `mongoDB://mongo:27017`  
To run your image then execute: `docker-compose up`  
To rebuild your image execute: `docker-compose build`  


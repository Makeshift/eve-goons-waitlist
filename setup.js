exports.oauth = {
	clientID: process.env.API_CLIENT_ID || "",
	secretKey: process.env.API_SECRET_KEY || "",
	callbackURL: process.env.OAUTH_CALLBACK_URL || "http://localhost:8113/auth/provider/callback",
	scopes: ['esi-location.read_location.v1','esi-location.read_ship_type.v1','esi-skills.read_skills.v1','esi-wallet.read_character_wallet.v1','esi-assets.read_assets.v1','esi-fleets.read_fleet.v1','esi-fleets.write_fleet.v1','esi-ui.open_window.v1','esi-ui.write_waypoint.v1','esi-fittings.read_fittings.v1','esi-location.read_online.v1'],
	userAgent: 'express 4.9.5, eve-sso, goons-incursionauth 2.0.0',
	baseSSOUrl: "login.eveonline.com"
};

exports.data = {
	directory: "data", //Where data will be stored
	sessionSecret: process.env.SECRET || "",
	mongoDbURL: process.env.MONGO_URI || "mongoDB://localhost:27017",
	mongoDbName: process.env.MONGO_DB || "EveGoonsWaitlist"
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
	port: process.env.PORT || 8113
}

//roleNumeric titles, use null to disable. Leave index0 as member
exports.userPermissions =  ["Member", "Trainee", null, "Fleet Commander", "Senior FC", "Leadership"];

exports.fleetCompFilters = {
	logi: [11987, 11989,22474,22442,37458,37460,37482,37480],//Guardian, Oneiros, Damnation, Eos, Kirin, Scalpel, Stork, Bifrost
	caps: [23757,37604,23915,37605,23911,37607,24483,37606,42242,45645],//Archon, Apostle, Chimera, Minokawa, Thanatos, Ninazu, Nidhoggur, Lif, Dagon, Loggerhead
	supers: [23919,11567,23917,3764,23913,671,22852,23773,42241,3514,42125,42126,45649]//Aeon, Avatar, Wyvern, Leviathan, Nyx, Erebus, Hel, Ragnarok, Molok, Revenant, Vendetta, Vanquisher, Komodo
}

exports.browserNotification = {
	"sound": '/includes/alarm.mp3',
	"appName": 'Imperium Incursions Waitlist',
	"imgUrl": '/includes/img/gsf-bee.png'
}
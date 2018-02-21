const setup = require('./setup.js');
const mongo = require('mongodb').MongoClient;
const log = require('./logger.js');

//Shamelessly stolen from stackoverflow because I loved this method of handling DB connections
const dbService = {
	db: undefined,
	connect: function (cb) {
		mongo.connect(setup.data.mongoDbURL, function (err, client) {
			if (err) {
				log.error('Database connection failure.', { err } );
				throw err;
			}
			dbService.db = client.db(setup.data.mongoDbName);
			log.info("Database connection successful.");
			cb();
		});
	}
};

module.exports = dbService;
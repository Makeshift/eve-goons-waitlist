const setup = require('./setup.js');
const mongo = require('mongodb').MongoClient;
const log = require('./logger.js')(module);

const MONGODB_URL = setup.data.mongoDbURL || process.env.MONGODB_URL ||'mongodb://localhost:27017';
const MONGO_DB = setup.data.mongoDbName || process.env.MONOGO_DB;

const absorbInitialConnectError = function absorbInitialConnectError(cb, database) {
  mongo.connect(MONGODB_URL, function (err, client) {
		if(err) {
			log.error('Database connection failure', {err});
			if(err.message && err.message.match(/failed to connect to server .* on first connect/)) {
                setTimeout(absorbInitialConnectError.bind(null, cb, dbService), 2000);
            }
		} else {
            if(database !== undefined) {
                database.db = client.db(MONGO_DB);
			} else {
                dbService.db = client.db(MONGO_DB);
            }
            
			log.info("Database connection successful.");
			cb();
		}
	});
};

let dbService = {connect: absorbInitialConnectError};

module.exports = dbService;
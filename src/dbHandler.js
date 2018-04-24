const setup = require('./setup.js');
const mongo = require('mongodb').MongoClient;
const log = require('./logger.js')(module);

const MONGODB_URL = process.env.MONGODB_URL || setup.data.mongoDbURL || 'mongodb://localhost:27017';

const absorbInitialConnectError = function absorbInitialConnectError(cb, database) {
  mongo.connect(MONGODB_URL, (err, client) => {
    if (err) {
      log.error('Database connection failure', { err });
      if (err.message && err.message.match(/failed to connect to server .* on first connect/)) {
        setTimeout(absorbInitialConnectError.bind(null, cb, dbService), 2000);
      }
    } else {
      if (database !== undefined) {
        // eslint-disable-next-line no-param-reassign
        database.db = client.db(setup.data.mongoDbName);
      } else {
        dbService.db = client.db(setup.data.mongoDbName);
      }
      log.info('Database connection successful.');
      cb();
    }
  });
};

const dbService = { connect: absorbInitialConnectError };

module.exports = dbService;

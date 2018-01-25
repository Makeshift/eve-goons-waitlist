const setup = require('./setup.js');
const mongo = require('mongodb').MongoClient;
//Shamelessly stolen from stackoverflow because I loved this method of handling DB connections
const dbService = {
  db: undefined,
  connect: function(cb) {
    mongo.connect(setup.data.mongoDbURL, function(err, client) {
      if (err) {
        mongo.close();
        console.log("Database connection failure.");
      }
      dbService.db = client.db(setup.data.mongoDbName);
      console.log("Database connection successful.");
      cb();
    });
  }
};

module.exports = dbService;
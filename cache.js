var fs = require('fs');
var path = require('path');
var esi = require('eve-swagger');
const db = require('./dbhandler.js').db.collection('cache');

module.exports = function (setup) {
	var module = {};

	module.query = function(id, cb) {
		if (typeof id === "number" || typeof id === "string") {
			id = new Array(id);
		}
		esi.names(id).then(function(item) {
			cb(item[0])
		})
	}

	module.addToDb = function(data, cb) {
		db.insert(data, function(err, result) {
			if (err) console.log(err);
			cb();
		})
	}

	module.get = function(id, cb) {
		db.findOne({'id': id}, function(err, doc) {
			if (err) console.log(err);
			if (docs.length === 0) {
				module.query(id, function(item) {
					module.addToDb(item);
					cb(item);
				})
			} else {
				cb(doc)
			}
		});
		
	}

	module.massQuery = function(ids, cb) {
		module.createCacheVariable(function() {
			db.find({ 'id': { $in: ids }}).toArray(function(err, docs) {
				if (err) console.log(err);
				var fullquery = [];
				for (var i = 0; i < docs.length; i++) {
					fullquery.push(docs[i].id);
				}

				if (fullquery.length > 0) {
				esi.names(fullquery).then(function(items) {
					db.insertMany(items, function(err, result) {
						if (err) console.log(err);
						if (typeof cb === "function") {
							cb(items);
						}
					})	
				})
			}
			});
			
		})
	}

	return module;
}
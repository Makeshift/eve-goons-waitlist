const fs = require('fs');
const path = require('path');
const esi = require('eve-swagger');
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
			if (typeof cb === "function") cb();
		})
	}
	//Duplicate key errors are caused by trying to 'get' stuff too quickly. NEED to make getting a background process
	module.get = function(id, cb) {
		db.findOne({'id': id}, function(err, doc) {
			if (err) console.log(err);
			if (doc === null) {
				module.query(id, function(item) {
					module.addToDb(item);
					cb(item);
				})
			} else {
				cb(doc)
			}
		});
		
	}

	function uniq(list) {
    	return list.reduce((acc, d) => acc.includes(d) ? acc : acc.concat(d), []);
	}

	function diffArray(arr1, arr2) {
	  var newArr = [];
	  var myArr=arr1.concat(arr2);
	  var count=0;
	  for(i=0;i<myArr.length;i++){
	    for(j=0;j<myArr.length;j++){
	      if(myArr[j]==myArr[i]){
	        count++;
	      }
	    }
	    if(count==1){
	      newArr.push(myArr[i]);
	    }
	    count=0;
	  }
	  return newArr;
	}


	module.massQuery = function(ids, cb) {
		ids = uniq(ids);
		db.find({ 'id': { $in: ids }}).toArray(function(err, docs) {
			if (err) console.log(err);
			var fullquery = [];
			for (var i = 0; i < docs.length; i++) {
				fullquery.push(docs[i].id);
			}
			var newBulkSearch = uniq(diffArray(fullquery, uniq(ids)));
			if (newBulkSearch.length > 0) {
			esi.names(newBulkSearch).then(function(items) {
				db.insertMany(items, function(err, result) {
					if (err) console.log(err);
					if (typeof cb === "function") {
						cb(items);
					}
				})	
			})
		}
		});
	}

	return module;
}
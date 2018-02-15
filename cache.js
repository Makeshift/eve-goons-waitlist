const fs = require('fs');
const path = require('path');
const esi = require('eve-swagger');
const db = require('./dbHandler.js').db.collection('cache');

module.exports = function (setup) {
	var module = {};
	var cachetemp = [];

	module.query = function(id, cb) {
			if (typeof id === "number" || typeof id === "string") {
				id = new Array(id);
			}
			esi.names(id).then(function(item) {
				cb(item[0]);
				module.removeFromCacheTemp(id);
			})
	}

	module.removeFromCacheTemp = function(id) {
		if (cachetemp.indexOf(id) > -1) {
			cachetemp.splice(cachetemp.indexOf(id), 1);
		}
	}

	module.addToDb = function(data, cb) {
		db.update({id: data.id}, data, { upsert: true }, function(err, result) {
			if (err) console.log(err);
			if (typeof cb === "function") cb();
		})
	}
	//Duplicate key errors are caused by trying to 'get' stuff too quickly. NEED to make getting a background process
	module.get = function(id, cb) {
			db.findOne({'id': id}, function(err, doc) {
				if (err) console.log(err);
				if (doc === null) {
					if (!cachetemp.includes(id)) {
						cachetemp.push(id);
						module.query(id, function(item) {
							module.addToDb(item);
							cb(item);
							module.removeFromCacheTemp(id);
						})
					} else {
						cb(id);
					}
				} else {
					cb(doc)
					module.removeFromCacheTemp(id);
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
		newids = [];
		for (var i = 0; i < ids.length; i++) {
			if (!cachetemp.includes(ids[i])) {
				newids.push(ids[i]);
				cachetemp.push(ids[i]);
			}
		}
		ids = newids;
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
					for (var i = 0; i < items.length; i++) {
						module.removeFromCacheTemp(items[i].id)
					}
				})	
			})
		}
		});
	}

	return module;
}
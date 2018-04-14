const esi = require('eve-swagger');
const db = require('./dbHandler.js').db.collection('cache');
const log = require('./logger.js')(module);

module.exports = function cache() {
  const module = {};
  const cachetemp = [];

  module.query = function getQuery(id, cb) {
    let queryId;
    if (typeof id === 'number' || typeof id === 'string') {
      queryId = new Array(id);
    } else {
      queryId = id;
    }
    esi.names(queryId).then((item) => {
      cb(item[0]);
      module.removeFromCacheTemp(queryId);
    }).catch((err) => {
      log.error('cache.query: Error for esi.names', { err, queryId });
    });
  };

  module.removeFromCacheTemp = function removeFromCacheTemp(id) {
    if (cachetemp.indexOf(id) > -1) {
      cachetemp.splice(cachetemp.indexOf(id), 1);
    }
  };

  module.addToDb = function addToDb(data, cb) {
    db.update({ id: data.id }, data, { upsert: true }, (err, result) => {
      if (err) {
        log.error('addToDb: Error for db.update', { err, id: data.id });
        log.debug(result);
        // TODO: should this continue?
      }
      if (typeof cb === 'function') cb();
    });
  };
  // Duplicate key errors are caused by trying to 'get' stuff too quickly. NEED to make getting a background process
  module.get = function get(id, cb) {
    db.findOne({ id }, (err, doc) => {
      if (err) log.error('get: Error for db.findOne', { err, id });
      if (doc === null) {
        if (!cachetemp.includes(id)) {
          cachetemp.push(id);
          module.query(id, (item) => {
            module.addToDb(item);
            cb(item);
            module.removeFromCacheTemp(id);
          });
        } else {
          cb(id);
        }
      } else {
        cb(doc);
        module.removeFromCacheTemp(id);
      }
    });
  };

  function uniq(list) {
    return list.reduce((acc, d) => (acc.includes(d) ? acc : acc.concat(d)), []);
  }

  function diffArray(arr1, arr2) {
    const newArr = [];
    const myArr = arr1.concat(arr2);
    let count = 0;
    for (let i = 0; i < myArr.length; i++) {
      for (let j = 0; j < myArr.length; j++) {
        if (myArr[j] === myArr[i]) {
          count += 1;
        }
      }
      if (count === 1) {
        newArr.push(myArr[i]);
      }
      count = 0;
    }
    return newArr;
  }


  module.massQuery = function massQuery(allIds, cb) {
    let ids = uniq(allIds);
    const newids = [];
    for (let i = 0; i < ids.length; i++) {
      if (!cachetemp.includes(ids[i])) {
        newids.push(ids[i]);
        cachetemp.push(ids[i]);
      }
    }
    ids = newids;
    db.find({ id: { $in: ids } }).toArray((err, docs) => {
      if (err) log.error('massQuery: Error for db.find', { err, ids });
      const fullquery = [];
      for (let i = 0; i < docs.length; i++) {
        fullquery.push(docs[i].id);
      }
      const newBulkSearch = uniq(diffArray(fullquery, uniq(ids)));
      if (newBulkSearch.length === 0) return;

      esi.names(newBulkSearch).then((items) => {
        db.insertMany(items, (err, result) => {
          if (err) log.error('cache.massQuery: Error for db.insertMany', { err, items });
          log.debug(result);
          if (typeof cb === 'function') {
            cb(items);
          }
          for (let i = 0; i < items.length; i++) {
            module.removeFromCacheTemp(items[i].id);
          }
        });
      }).catch((err) => {
        log.error('cache.query: Error for esi.names', { err, newBulkSearch });
      });
    });
  };

  return module;
};

/*
Create or add new entries
Read, retrieve, search, or view existing entries
Update or edit existing entries
Delete/deactivate existing entries
*/
var $ = require('jquery');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

function MongoCrud(url) {
    var _self = this;
    _self.db = {};
    _self.queries;
    _self.queryObjects = {};
    _self.lastTerm = '';
    //_self.base = {};
    _self.collections = {};
    MongoClient.connect(url, function (err, db) {
        if (err) { console.log(err); }
        else {
            console.log('connected to mongodb');
            _self.db = db
        }
    });

}

MongoCrud.prototype.CREATE = function (json, collection, callback) {
    _self = this;
    if (!json._id) {
        json._id = new ObjectID();
    }
    _self.db.collectionNames(collection, function (err, items) {
        if (items.length < 1) {
            _self.db.createCollection(collection, function (err, result) {
                console.log('created:', collection, err, result);
            });
        }
    });

    _self.db.collection(collection).find(json).toArray(function (err, results) {
        if (!err) {
            if (results.length == 0) {
                _self.db.collection(collection).insert(json, function (err, result) {
                    console.log('insert', err, result);
                });

                _self.db.ensureIndex(collection, json, { unique: true, background: true, dropDups: true, w: 1 }, function (err, indexName) {
                    callback('inserted new record');
                });
            }
        }
        else {
            console.log(err);
        }
    });
    //store schema paths _self.collections[collection] = {};
    _self._buildQuerys(false, '', _self.collections[collection]);
    //_self.queryObjects

    _self.db.collection(collection).find({ "schema": collection }).toArray(function (err, results) {
        if (!err) {
            if (results.length == 0) {
                _self.db.collection(collection).insert({ "schema": collection, "paths": [] }, function (err, result) {
                    for (path in _self.queryObjects) {
                        _self.db.collection(collection).update({ "schema": collection }, { "$addToSet": { "paths": path} }, function (err, count) {
                            if (err) { console.log(err); }
                            //console.log('inserted ', count, ' paths');
                        });
                    }
                });
            }
            else {
                for (path in _self.queryObjects) {
                    _self.db.collection(collection).update({ "schema": collection }, { "$addToSet": { "paths": path} }, function (err, count) {
                        if (err) { console.log(err); }
                        //console.log('inserted ', count, ' paths');
                    });
                }
            }
        }
        else {
            console.log(err);
        }
    });



}

MongoCrud.prototype.UPDATE = function (query, collection, callback) {
    var _self = this;
    _self.db.collection(collection).update({ _id: ObjectID(query._id) }, { $set: query.set }, function (err, json) {
        if (err) { console.log(err); }
        callback(json);
    });
}

MongoCrud.prototype.READ = function (query, collection, callback) {
    var term = query.value;
    var path = query.path;
    var _self = this;
    var query = {};
    if (_self.lastTerm.length > term.length || term.length <= 3) {
        _self.queries = undefined;
    }
    _self.lastTerm = term;
    _self.db.collection(collection).find({ "schema": collection }).toArray(function (err, results) {
        //clear local queries
        _self.queries = [];
        for (var i = 0; i < results[0]['paths'].length; i++) {
            var queryObject = {};
            queryObject[results[0]['paths'][i]] = new RegExp(term, 'i');
            _self.queries.push(queryObject);
            //create local queries frm DB paths and search term
        }
        if (path == "*") { query = { $or: _self.queries }}
        else {query[path] = term;}
        console.log('query db:', term);
        _self.db.collection(collection).find(query).toArray(function (err, json) {

            _self._results(path, term, json, callback);
        });
    });

}

MongoCrud.prototype.DELETE = function (query, callback) {
}

MongoCrud.prototype._results = function (path, term, json, callback) {
    var _self = this;
    var data = {};
        data.path = path;
        data.json = [];
    var jsonData = {};
    if (json) {

        if (path == "*") {
            _self.queries = [];
            for (var i = 0; i < json.length; i++) {
                var results = _self._buildQuerys(true, term, json[i]);
                /*
                for (query in _self.queryObjects) {
                //console.log(query);
                var queryObject = {};
                queryObject[query] = _self.queryObjects[query];
                _self.queries.push(queryObject);
                }
                */
                //_self.queries = results.queries;
                for (var j = 0; j < results.values.length; j++) {

                    //_self.queries.push(results.queries[j]);

                    jsonData = {};
                    jsonData.path = results.paths[j];
                    jsonData.value = results.values[j];

                    data.json.push(jsonData);

                }
            }
        } else {

            data.json = json;
        }
    }
    console.log('results:', data.json.length);
    callback(data);
}

MongoCrud.prototype._buildQuerys = function (match, term, json, path, paths, values, query, queries, _id) {
    var _self = this;
    var type = $.type(json);
    var children = [];
    var delimiter = "";

    if (!_id) { _id = json._id.toString(); }
    if (!queries) { queries = []; }
    if (!query) { query = ''; }
    if (!paths) { paths = []; }
    if (!values) { values = []; }
    if (!path) { path = ''; }
    if (path != '') { delimiter = "."; }

    switch (type) {
        case 'array':
            for (var j = 0; j < json.length; ++j) {
                children[j] = _self._buildQuerys(match, term, json[j], path + delimiter + j, paths, values, query, queries, _id);
            }
            break;
        case 'function':
            break;
        case 'object':
            for (var prop in json) {
                if (prop != '_id' && prop != '__v') {
                    children[j] = _self._buildQuerys(match, term, json[prop], path + delimiter + prop, paths, values, query + delimiter + prop, queries, _id);
                }
            }
            break;
        default:
            if (!match || json.match(new RegExp(term, 'i'))) {
                var queryObject = {};
                queryObject[query] = new RegExp(term, 'i');
                _self.queryObjects[query] = new RegExp(term, 'i');
                if (!match) {
                    if (queries.indexOf(queryObject) == -1) {
                        queries.push(queryObject);
                    }
                } else {
                    queryObject['_id'] = ObjectID(_id);
                    queries.push(queryObject);
                }
                paths.push(path);
                values.push(json);
                children = json;
            }
            break;
    }
    return ({ 'match': match, 'term': term, 'json': children, 'path': path, 'paths': paths, 'values': values, 'query': query, 'queries': queries, '_id': _id });
}

module.exports = exports = MongoCrud;
exports.MongoCrud = MongoCrud;
exports.native = undefined;
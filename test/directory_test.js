var path = require("path");
var assert = require("assert");
var vows = require("vows");
var strata = require("../lib");
var utils = strata.utils;
var mock = strata.mock;
var directory = strata.directory;

vows.describe("directory").addBatch({
  "A directory middleware": {
    "when the request targets a directory that is present": {
      topic: function () {
        var app = directory(utils.notFound, __dirname);
        mock.call(app, "/_files", this.callback);
      },
      "should return a directory listing of that directory": function (err, status, headers, body) {
        assert.equal(status, 200);
      }
    },
    "when the request targets a directory that is not present": {
      topic: function () {
        var app = directory(utils.notFound, __dirname);
        mock.call(app, "/non-existant", this.callback);
      },
      "should pass the request downstream": function (err, status, headers, body) {
        assert.equal(status, 404);
      }
    },
    "when the request targets a file that is present": {
      topic: function () {
        var app = directory(utils.notFound, __dirname);
        mock.call(app, "/" + path.basename(__filename), this.callback);
      },
      "should pass the request downstream": function (err, status, headers, body) {
        assert.equal(status, 404);
      }
    }
  }
}).export(module);

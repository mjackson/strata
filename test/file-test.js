var path = require("path");
var fs = require("fs");
var EventEmitter = require("events").EventEmitter;
var assert = require("assert");
var vows = require("vows");
var strata = require("../lib");
var utils = strata.utils;
var mock = strata.mock;
var file = strata.file;

var root = path.join(__dirname, "_files");

vows.describe("file").addBatch({
  "A file middleware": {
    topic: function () {
      return file(utils.notFound, root, "index.html");
    },
    "when a static file is requested": {
      topic: function (app) {
        this.body = fs.readFileSync(path.join(root, "text"), "utf8");
        mock.call(app, "/text", this.callback);
      },
      "should return a 200": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should serve that file": function (err, status, headers, body) {
        assert.equal(body, this.body);
      },
      "should set the correct Content-Type": function (err, status, headers, body) {
        assert.equal(headers["Content-Type"], "text/plain");
      }
    },
    "when a directory is requested": {
      topic: function (app) {
        this.body = fs.readFileSync(path.join(root, "index.html"), "utf8");
        mock.call(app, "/", this.callback);
      },
      "should return a 200": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should serve the index file": function (err, status, headers, body) {
        assert.equal(body, this.body);
      },
      "should set the correct Content-Type": function (err, status, headers, body) {
        assert.equal(headers["Content-Type"], "text/html");
      }
    },
    "when a matching file cannot be found": {
      topic: function (app) {
        mock.call(app, "/does-not-exist", this.callback);
      },
      "should forward the request to the downstream app": function (err, status, headers, body) {
        assert.equal(status, 404);
      }
    },
    "when the path contains ..": {
      topic: function (app) {
        mock.call(app, "/../etc/passwd", this.callback);
      },
      "should respond with a 403": function (err, status, headers, body) {
        assert.equal(status, 403);
      }
    }
  },
  "A file middleware with multiple index files": {
    topic: function () {
      return file(utils.notFound, root, ["index.htm", "index.html"]);
    },
    "when a directory is requested": {
      topic: function (app) {
        this.body = fs.readFileSync(path.join(root, "index.html"), "utf8");
        mock.call(app, "/", this.callback);
      },
      "should return a 200": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should serve the first index file that exists": function (err, status, headers, body) {
        assert.equal(body, this.body);
      },
      "should set the correct Content-Type": function (err, status, headers, body) {
        assert.equal(headers["Content-Type"], "text/html");
      }
    }
  }
}).export(module);

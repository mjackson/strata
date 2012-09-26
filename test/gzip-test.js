var path = require("path");
var fs = require("fs");
var assert = require("assert");
var vows = require("vows");
var BufferedStream = require("bufferedstream");
var strata = require("../lib");
var utils = strata.utils;
var mock = strata.mock;
var gzip = strata.gzip;
var file = strata.file;

vows.describe("gzip").addBatch({
  "A gzip middleware": {
    "with a string body": {
      topic: function () {
        this.file = path.resolve(__dirname, "_files/test.txt");
        this.body = fs.readFileSync(this.file + ".gz", "utf8");

        var self = this;
        var app = gzip(function (env, callback) {
          var body = fs.readFileSync(self.file, "utf8");
          callback(200, { "Content-Type": "text/plain" }, body);
        });

        mock.call(app, mock.env({
          headers: {
            "Accept-Encoding": "gzip, *"
          }
        }), this.callback);
      },
      "should gzip encode it": function (err, status, headers, body) {
        assert.equal(headers["Content-Encoding"], "gzip");
        assert.equal(body, this.body);
      }
    },
    "with a Stream body": {
      topic: function () {
        this.file = path.resolve(__dirname, "_files/test.txt");
        this.body = fs.readFileSync(this.file + ".gz", "utf8");

        var self = this;
        var app = gzip(function (env, callback) {
          var body = new BufferedStream(fs.readFileSync(self.file, "utf8"));
          callback(200, { "Content-Type": "text/plain" }, body);
        });

        mock.call(app, mock.env({
          headers: {
            "Accept-Encoding": "gzip, *"
          }
        }), this.callback);
      },
      "should gzip encode it": function (err, status, headers, body) {
        assert.equal(headers["Content-Encoding"], "gzip");
        assert.equal(body, this.body);
      }
    },
    "with a file Stream body": {
      topic: function () {
        this.file = path.resolve(__dirname, "_files/test.txt");
        this.body = fs.readFileSync(this.file + ".gz", "utf8");

        var app = utils.notFound;
        app = file(app, path.resolve(__dirname, "_files"));
        app = gzip(app);

        mock.call(app, mock.env({
          pathInfo: "/test.txt",
          headers: {
            "Accept-Encoding": "gzip, *"
          }
        }), this.callback);
      },
      "should gzip encode it": function (err, status, headers, body) {
        assert.equal(headers["Content-Encoding"], "gzip");
        assert.equal(body, this.body);
      }
    },
    "when the client does not accept gzip encoding": {
      topic: function () {
        this.file = path.resolve(__dirname, "_files/test.txt");
        this.body = fs.readFileSync(this.file, "utf8");

        var self = this;
        var app = gzip(function (env, callback) {
          callback(200, { "Content-Type": "text/plain" }, self.body);
        });

        mock.call(app, '/', this.callback);
      },
      "should not encode the body": function (err, status, headers, body) {
        assert.equal(headers["Content-Type"], "text/plain");
        assert.isUndefined(headers["Content-Encoding"]);
        assert.equal(body, this.body);
      }
    }
  }
}).export(module);

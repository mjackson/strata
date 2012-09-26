var assert = require("assert");
var vows = require("vows");
var BufferedStream = require("bufferedstream");
var strata = require("../lib");
var mock = strata.mock;
var contentLength = strata.contentLength;

vows.describe("contentLength").addBatch({
  "A contentLength middleware": {
    "with a string body": {
      topic: function () {
        this.body = "Hello world!";

        var self = this;
        var app = contentLength(function (env, callback) {
          callback(200, { "Content-Type": "text/plain" }, self.body);
        });

        mock.call(app, '/', this.callback);
      },
      "should add a Content-Length header": function (err, status, headers, body) {
        var length = this.body.length.toString();
        assert.strictEqual(headers["Content-Length"], length);
      }
    },
    "with a Stream body": {
      topic: function () {
        this.body = new BufferedStream("Hello world!");

        var self = this;
        var app = contentLength(function (env, callback) {
          callback(200, { "Content-Type": "text/plain" }, self.body);
        });

        mock.call(app, mock.env({
          error: mock.stream(this)
        }), this.callback);
      },
      "should write to error": function (err) {
        assert.match(this.data, /body with no length/);
      }
    }
  }
}).export(module);

var assert = require("assert");
var vows = require("vows");
var strata = require("../lib");
var utils = strata.utils;
var mock = strata.mock;
var basicAuth = strata.basicAuth;

vows.describe("basicAuth").addBatch({
  "An basicAuth middleware": {
    "when no validation function is given": {
      "should throw": function () {
        assert.throws(function () {
          var app = basicAuth(utils.ok);
        }, /validation function/);
      }
    },
    "when authorization fails": {
      topic: function () {
        var user = "michael";
        var pass = "s3krit";
        var credentials = new Buffer(user + ":" + pass).toString("base64");

        var app = basicAuth(utils.ok, function (user, pass, callback) {
          callback(null, false);
        });

        mock.call(app, mock.env({
          headers: {
            "Authorization": "Basic " + credentials
          }
        }), this.callback);
      },
      "should return 401": function (err, status, headers, body) {
        assert.equal(status, 401);
        assert.ok(headers["WWW-Authenticate"]);
      }
    },
    "when authorization succeeds": {
      topic: function () {
        var user = "michael";
        var pass = "s3krit";
        var credentials = new Buffer(user + ":" + pass).toString("base64");

        var app = basicAuth(function (env, callback) {
          callback(200, {
            "Content-Type": "text/plain",
            "X-RemoteUser": env.remoteUser
          }, "");
        }, function (user, pass, callback) {
          callback(null, user);
        });

        mock.call(app, mock.env({
          headers: {
            "Authorization": "Basic " + credentials
          }
        }), this.callback);
      },
      "should pass the request downstream": function (err, status, headers, body) {
        assert.equal(status, 200);
      },
      "should set the remoteUser environment variable": function (err, status, headers, body) {
        assert.ok(headers["X-RemoteUser"]);
        assert.equal(headers["X-RemoteUser"], "michael");
      }
    }
  }
}).export(module);

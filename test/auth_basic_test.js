var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    authBasic = require("./../lib/auth/basic"),
    utils = require("./../lib/utils");

vows.describe("auth/basic").addBatch({
    "An authBasic middleware": {
        "when no validation function is given": {
            "should throw": function () {
                assert.throws(function () {
                    var app = authBasic(utils.empty);
                }, /validation function/);
            }
        },
        "when authorization fails": {
            topic: function () {
                var user = "michael";
                var pass = "s3krit";
                var credentials = new Buffer(user + ":" + pass).toString("base64");

                var app = authBasic(utils.empty, function (user, pass, callback) {
                    callback(null, false);
                });

                mock.request({
                    headers: {
                        "Authorization": "Basic " + credentials
                    }
                }, app, this.callback);
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

                var app = authBasic(function (env, callback) {
                    callback(200, {
                        "Content-Type": "text/plain",
                        "X-RemoteUser": env.remoteUser
                    }, "");
                }, function (user, pass, callback) {
                    callback(null, user);
                });

                mock.request({
                    headers: {
                        "Authorization": "Basic " + credentials
                    }
                }, app, this.callback);
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

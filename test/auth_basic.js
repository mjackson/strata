var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    authBasic = require("./../lib/auth/basic");

vows.describe("auth_basic").addBatch({
    "An authBasic middleware": {
        "should return 401 when no validation function is given": function () {
            var sync = false;
            var user = "michael";
            var pass = "s3krit";

            var credentials = new Buffer(user + ":" + pass).toString("base64");

            var app = authBasic(mock.empty);

            mock.request({
                headers: {
                    "Authorization": "Basic " + credentials
                }
            }, app, function (status, headers, body) {
                sync = true;
                assert.equal(status, 401);
                assert.ok(headers["WWW-Authenticate"]);
            })

            assert.ok(sync);
        },
        "should return 401 when authorization fails": function () {
            var sync = false;
            var user = "michael";
            var pass = "s3krit";

            var credentials = new Buffer(user + ":" + pass).toString("base64");

            var app = authBasic(mock.empty, function (user, pass, callback) {
                callback(null, false);
            });

            mock.request({
                headers: {
                    "Authorization": "Basic " + credentials
                }
            }, app, function (status, headers, body) {
                sync = true;
                assert.equal(status, 401);
                assert.ok(headers["WWW-Authenticate"]);
            })

            assert.ok(sync);
        },
        "should pass the request downstream when authorization succeeds": function () {
            var sync = false;
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
            }, app, function (status, headers, body) {
                sync = true;
                assert.equal(status, 200);
                assert.equal(headers["X-RemoteUser"], user);
            })

            assert.ok(sync);
        }
    }
}).export(module);

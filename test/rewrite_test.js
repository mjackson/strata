var assert = require("assert"),
    vows = require("vows"),
    strata = require("./../lib"),
    mock = strata.mock,
    rewrite = strata.rewrite;

vows.describe("rewrite").addBatch({
    "A rewrite middleware": {
        topic: function () {
            var app = function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-PathInfo": env.pathInfo
                }, "");
            };

            app = rewrite(app, "/abc", "/xyz");
            app = rewrite(app, /\/def/g, "/xyz");

            return app;
        },
        "when /abc is requested": {
            topic: function (app) {
                mock.request("/abc", app, this.callback);
            },
            "should rewrite properly": function (err, status, headers, body) {
                assert.ok(headers["X-PathInfo"]);
                assert.equal(headers["X-PathInfo"], "/xyz");
            }
        },
        "when /def is requested": {
            topic: function (app) {
                mock.request("/def", app, this.callback);
            },
            "should rewrite properly": function (err, status, headers, body) {
                assert.ok(headers["X-PathInfo"]);
                assert.equal(headers["X-PathInfo"], "/xyz");
            }
        },
        "when /def/path/def is requested": {
            topic: function (app) {
                mock.request("/def/path/def", app, this.callback);
            },
            "should rewrite properly": function (err, status, headers, body) {
                assert.ok(headers["X-PathInfo"]);
                assert.equal(headers["X-PathInfo"], "/xyz/path/xyz");
            }
        }
    }
}).export(module);

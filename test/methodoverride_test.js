var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/link/mock"),
    methodOverride = require("./../lib/link/methodoverride");

vows.describe("methodoverride").addBatch({
    "A methodOverride middleware": {
        topic: function () {
            var app = methodOverride(function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-RequestMethod": env.requestMethod
                }, "");
            });

            return app;
        },
        "when using GET should not modify the requestMethod": function (app) {
            mock.request("/?_method=put", app, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-RequestMethod"], "GET");
            });
        },
        "when using POST should override the requestMethod": {
            "with one given in a query parameter": function (app) {
                mock.request({
                    requestMethod: "POST",
                    queryString: "_method=put"
                }, app, function (status, headers, body) {
                    assert.equal(status, 200);
                    assert.equal(headers["X-RequestMethod"], "PUT");
                });
            },
            "with one given in a body parameter": function (app) {
                mock.request({
                    requestMethod: "POST",
                    input: "_method=put"
                }, app, function (status, headers, body) {
                    assert.equal(status, 200);
                    assert.equal(headers["X-RequestMethod"], "PUT");
                });
            }
        }
    }
}).export(module);

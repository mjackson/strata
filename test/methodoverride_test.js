var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    methodOverride = require("./../lib/methodoverride");

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
        "when using GET": {
            topic: function (app) {
                mock.request("/?_method=put", app, this.callback);
            },
            "should return 200": function (err, status, headers, body) {
                assert.equal(status, 200);
            },
            "should not modify the request method": function (err, status, headers, body) {
                assert.equal(headers["X-RequestMethod"], "GET");
            }
        },
        "when using POST with a method in the queryString": {
            topic: function (app) {
                mock.request({
                    requestMethod: "POST",
                    queryString: "_method=put"
                }, app, this.callback);
            },
            "should return 200": function (err, status, headers, body) {
                assert.equal(status, 200);
            },
            "should modify the request method": function (err, status, headers, body) {
                assert.equal(headers["X-RequestMethod"], "PUT");
            }
        },
        "when using POST with a method in the post body": {
            topic: function (app) {
                mock.request({
                    requestMethod: "POST",
                    input: "_method=put"
                }, app, this.callback);
            },
            "should return 200": function (err, status, headers, body) {
                assert.equal(status, 200);
            },
            "should modify the request method": function (err, status, headers, body) {
                assert.equal(headers["X-RequestMethod"], "PUT");
            }
        },
        "when using POST with a method in the HTTP headers": {
            topic: function (app) {
                mock.request({
                    requestMethod: "POST",
                    headers: {
                        "X-Http-Method-Override": "put"
                    }
                }, app, this.callback);
            },
            "should return 200": function (err, status, headers, body) {
                assert.equal(status, 200);
            },
            "should modify the request method": function (err, status, headers, body) {
                assert.equal(headers["X-RequestMethod"], "PUT");
            }
        }
    }
}).export(module);

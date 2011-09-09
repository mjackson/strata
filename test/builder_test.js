var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    mock = require("./../lib/mock"),
    Builder = require("./../lib/builder");

/**
 * A simple middleware that increments the X-Count header when called.
 */
function count(app) {
    return function (env, callback) {
        app(env, function (status, headers, body) {
            headers["X-Count"] = (parseInt(headers["X-Count"] || 0) + 1).toString();
            callback(status, headers, body);
        });
    }
}

vows.describe("builder").addBatch({
    "A Builder": {
        topic: function () {
            var app = new Builder;

            app.use(count);

            app.map("/sub", function (app) {
                app.use(count);
                app.run(function (env, callback) {
                    callback(200, {
                        "Content-Type": "text/plain",
                        "X-Position": "sub"
                    }, "");
                });
            });

            app.route("/route", function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Position": "route"
                }, "");
            });

            app.route("/sub", function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Position": "route-sub"
                }, "");
            });

            app.run(function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Position": "root"
                }, "");
            });

            return app;
        },
        "when / is requested": {
            topic: function (app) {
                mock.request("/", app, this.callback);
            },
            "should call middleware": function (err, status, headers, body) {
                assert.equal(headers["X-Count"], "1");
            },
            "should properly map to an app at the root of the server": function (err, status, headers, body) {
                assert.equal(headers["X-Position"], "root");
            }
        },
        "when /sub is requested": {
            topic: function (app) {
                mock.request("/sub", app, this.callback);
            },
            "should call middleware mounted at /sub": function (err, status, headers, body) {
                assert.equal(headers["X-Count"], "2");
            },
            "should properly map to an app at /sub": function (err, status, headers, body) {
                assert.equal(headers["X-Position"], "sub");
            }
        },
        "when /route is requsted": {
            topic: function (app) {
                mock.request("/route", app, this.callback);
            },
            "should call middleware": function (err, status, headers, body) {
                assert.equal(headers["X-Count"], "1");
            },
            "should properly route": function (err, status, headers, body) {
                assert.equal(headers["X-Position"], "route");
            }
        }
    }
}).export(module);

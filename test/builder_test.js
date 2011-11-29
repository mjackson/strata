var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    mock = require("./../lib/mock"),
    Builder = require("./../lib/builder");

// Increments the X-Count header when called.
function count(app) {
    return function (env, callback) {
        app(env, function (status, headers, body) {
            headers["X-Count"] = (parseInt(headers["X-Count"] || 0) + 1).toString();
            callback(status, headers, body);
        });
    }
}

// Sets the X-Position header to "root" if it hasn't been set.
function root(app) {
    return function (env, callback) {
        app(env, function (status, headers, body) {
            headers["X-Position"] = headers["X-Position"] || "root";
            callback(status, headers, body);
        });
    }
}

vows.describe("builder").addBatch({
    "A Builder": {
        topic: function () {
            var app = new Builder;

            app.use(root);
            app.use(count);

            app.route("/one", function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Route": "/one"
                }, "");
            });

            app.route("/two", function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Route": "/two"
                }, "");
            });

            app.map("/one", function (app) {
                app.use(count);
                app.run(function (env, callback) {
                    callback(200, {
                        "Content-Type": "text/plain",
                        "X-Position": "one"
                    }, "");
                });
            });

            return app;
        },
        "when a match cannot be made": {
            topic: function (app) {
                mock.request("/doesnt-exist", app, this.callback);
            },
            "should return 404": function (err, status, headers, body) {
                assert.equal(status, 404);
            }
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
        "when /one is requested": {
            topic: function (app) {
                mock.request("/one", app, this.callback);
            },
            "should call all middleware": function (err, status, headers, body) {
                assert.equal(headers["X-Count"], "2");
            },
            "should properly map": function (err, status, headers, body) {
                assert.equal(headers["X-Position"], "one");
            }
        },
        "when /two is requested": {
            topic: function (app) {
                mock.request("/two", app, this.callback);
            },
            "should call all middleware": function (err, status, headers, body) {
                assert.equal(headers["X-Count"], "1");
            },
            "should properly route": function (err, status, headers, body) {
                assert.equal(headers["X-Position"], "root");
                assert.equal(headers["X-Route"], "/two");
            }
        }
    }
}).export(module);

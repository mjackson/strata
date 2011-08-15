var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    mock = require("./../lib/link/mock"),
    Builder = require("./../lib/link/builder");

vows.describe("builder").addBatch({
    "A Builder": {
        "should support mapping": function () {
            var sync = false;
            var app = new Builder;

            app.map("/sub", function (app) {
                app.use(function (app) {
                    return function (env, callback) {
                        app(env, function (status, headers, body) {
                            headers["X-Middleware"] = "called";
                            callback(status, headers, body);
                        });
                    }
                });
                app.run(function (env, callback) {
                    callback(200, {
                        "Content-Type": "text/plain",
                        "X-Position": "sub"
                    }, "");
                });
            });
            app.run(function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Position": "root"
                }, "");
            });

            mock.request("/", app, function (status, headers, body) {
                assert.equal(headers["X-Position"], "root");
            });
            mock.request("/sub", app, function (status, headers, body) {
                sync = true;
                assert.equal(headers["X-Position"], "sub");
                assert.equal(headers["X-Middleware"], "called");
            });

            assert.ok(sync);
        },
        "should support routing": function () {
            var sync = false;
            var app = new Builder;

            app.use(function (app) {
                return function (env, callback) {
                    app(env, function (status, headers, body) {
                        headers["X-Middleware"] = "called";
                        callback(status, headers, body);
                    });
                }
            });

            app.route("/sub", function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Position": "sub"
                }, "");
            });
            app.run(function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Position": "root"
                }, "");
            });

            mock.request("/", app, function (status, headers, body) {
                assert.equal(headers["X-Position"], "root");
                assert.equal(headers["X-Middleware"], "called");
            });
            mock.request("/sub", app, function (status, headers, body) {
                sync = true;
                assert.equal(headers["X-Position"], "sub");
                assert.equal(headers["X-Middleware"], "called");
            });

            assert.ok(sync);
        },
        "should favor map over route": function () {
            var sync = false;
            var app = new Builder;

            app.map("/files", function (app) {
                app.run(function (env, callback) {
                    callback(200, {
                        "X-Method": "map",
                        "Content-Type": "text/plain"
                    }, "");
                });
            });

            app.route("/files", function (env, callback) {
                callback(200, {
                    "X-Method": "route",
                    "Content-Type": "text/plain"
                }, "");
            });

            mock.request("/files", app, function (status, headers, body) {
                sync = true;
                assert.equal(headers["X-Method"], "map");
            });

            assert.ok(sync);
        },
        "should not dup env when mapping": function () {
            var key = "some_key";
            var value = "a value";
            var app = new Builder;

            app.use(function (app) {
                return function (env, callback) {
                    app(env, callback);
                    assert.equal(env[key], value);
                }
            });
            app.map("/", function (app) {
                app.run(function (env, callback) {
                    env[key] = value;
                    callback(200, {"Content-Type": "text/plain"}, "");
                });
            });

            mock.request("/", app, function (status, headers, body) {});
        }
    }
}).export(module);

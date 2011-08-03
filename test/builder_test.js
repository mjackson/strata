var assert = require("assert"),
    vows = require("vows"),
    path = require("path"),
    mock = require("./../lib/link/mock"),
    Builder = require("./../lib/link/builder");

vows.describe("builder").addBatch({
    "A Builder": {
        "should support mapping": function () {
            var app = new Builder;

            app.map("/", function (app) {
                app.run(function (env, callback) {
                    callback(200, {
                        "Content-Type": "text/plain",
                        "X-Position": "root"
                    }, "");
                });
            });
            app.map("/sub", function (app) {
                app.run(function (env, callback) {
                    callback(200, {
                        "Content-Type": "text/plain",
                        "X-Position": "sub"
                    }, "");
                });
            });

            mock.request("/", app, function (status, headers, body) {
                assert.equal(headers["X-Position"], "root");
            });
            mock.request("/sub", app, function (status, headers, body) {
                assert.equal(headers["X-Position"], "sub");
            });
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
        },
        "should be able to build an app from a file": function () {
            var file = path.join(__dirname, "_files/app.lu");
            var app = Builder.fromFile(file);

            mock.request("/", app, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "root");
            });
            mock.request("/path", app, function (status, headers, body) {
                assert.equal(status, 200);
                assert.equal(headers["X-Position"], "path");
            });
        }
    }
}).export(module);

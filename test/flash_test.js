var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    flash = require("./../lib/flash");

vows.describe("flash").addBatch({
    "A flash middleware": {
        topic: function () {
            var app = flash(function (env, callback) {
                callback(200, {
                    "Content-Type": "text/plain",
                    "Content-Length": "0",
                    "X-EnvFlash": String(env.flash)
                }, "");
            });

            return app;
        },
        "when called with a valid environment": {
            topic: function (app) {
                var env = mock.env("/");
                this.flash = "Hello world.";
                flash.set(env, this.flash);
                mock.call(app, env, this.callback);
            },
            "should set the flash environment variable": function (err, status, headers, body) {
                assert.ok(headers["X-EnvFlash"]);
                assert.equal(headers["X-EnvFlash"], this.flash);
            }
        }
    }
}).export(module);

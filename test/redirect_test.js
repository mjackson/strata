var assert = require("assert"),
    vows = require("vows"),
    strata = require("./../lib"),
    redirect = strata.redirect,
    mock = strata.mock;

vows.describe("redirect").addBatch({
    "redirect": {
        topic: function () {
            this.location = "/login";

            var self = this;
            var app = function (env, callback) {
                redirect(env, callback, self.location);
            };

            mock.request("", app, this.callback);
        },
        "should return a 302": function (err, status, headers, body) {
            assert.equal(status, 302);
        },
        "should redirect to the proper location": function (err, status, headers, body) {
            assert.equal(headers["Location"], this.location);
        }
    },
    "redirect.forward": {
        topic: function () {
            this.location = "/login";

            var recordLocation = function (app) {
                return function (env, callback) {
                    app(env, function (status, headers, body) {
                        var session = env.session;
                        headers["X-Referrer"] = session["strata.referrer"];
                        callback(status, headers, body);
                    });
                }
            };

            var self = this;
            var app = recordLocation(function (env, callback) {
                redirect.forward(env, callback, self.location);
            });

            mock.request("/admin", app, this.callback);
        },
        "should return a 302": function (err, status, headers, body) {
            assert.equal(status, 302);
        },
        "should redirect to the proper location": function (err, status, headers, body) {
            assert.equal(headers["Location"], this.location);
        },
        "should record the current location in the session": function (err, status, headers, body) {
            assert.equal(headers["X-Referrer"], "/admin");
        }
    },
    "redirect.back": {
        topic: function () {
            this.location = "/admin";

            var self = this;
            var forwardLocation = function (app) {
                return function (env, callback) {
                    // Simulate a redirect.forward.
                    env.session = {"strata.referrer": self.location};

                    app(env, function (status, headers, body) {
                        var session = env.session;
                        headers["X-Referrer"] = session["strata.referrer"] || "";
                        callback(status, headers, body);
                    });
                }
            };

            var app = forwardLocation(function (env, callback) {
                redirect.back(env, callback);
            });

            mock.request("", app, this.callback);
        },
        "should return a 302": function (err, status, headers, body) {
            assert.equal(status, 302);
        },
        "should redirect to the proper location": function (err, status, headers, body) {
            assert.equal(headers["Location"], this.location);
        },
        "should delete the old location from the session": function (err, status, headers, body) {
            assert.equal(headers["X-Referrer"], "");
        }
    }
}).export(module);

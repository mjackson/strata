var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/mock"),
    router = require("./../lib/router");

vows.describe("router").addBatch({
    "A router middleware": {
        topic: function () {
            var localRouter = router();

            var app = function (env, callback) {
                var routeParams = env.route;

                assert.ok(routeParams);

                callback(200, {
                    "Content-Type": "text/plain",
                    "X-Route": JSON.stringify(routeParams),
                    "X-Id": String(routeParams.id)
                }, "");
            };

            localRouter.route(/\/users\/(\d+)/i, app);
            localRouter.route("/posts/:id", app, "GET");
            localRouter.route("/posts/:id", app, ["POST", "DELETE"]);

            return localRouter;
        },
        "when a match cannot be made": {
            topic: function (app) {
                mock.request("", app, this.callback);
            },
            "should return 404": function (err, status, headers, body) {
                assert.equal(status, 404);
            },
        },
        "when /users/1 is requested": {
            topic: function (app) {
                mock.request("/users/1", app, this.callback);
            },
            "should call the correct app": function (err, status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/users/1", "1"]);
            },
            "should not set the id route parameter": function (err, status, headers, body) {
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "undefined");
            }
        },
        "when /posts/1 is requested": {
            topic: function (app) {
                mock.request("/posts/1", app, this.callback);
            },
            "should call the correct app": function (err, status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/posts/1", "1"]);
            },
            "should set the id route parameter": function (err, status, headers, body) {
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "1");
            }
        },
        "when POST /posts/2 is requested": {
            topic: function (app) {
                mock.request({
                    requestMethod: "POST",
                    pathInfo: "/posts/2"
                }, app, this.callback);
            },
            "should call the correct app": function (err, status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/posts/2", "2"]);
            },
            "should set the id route parameter": function (err, status, headers, body) {
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "2");
            }
        },
        "when DELETE /posts/3 is requested": {
            topic: function (app) {
                mock.request({
                    requestMethod: "DELETE",
                    pathInfo: "/posts/3"
                }, app, this.callback);
            },
            "should call the correct app": function (err, status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/posts/3", "3"]);
            },
            "should set the id route parameter": function (err, status, headers, body) {
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "3");
            }
        },
        "when PUT /posts/1 is requested": {
            topic: function (app) {
                mock.request({
                    requestMethod: "PUT",
                    pathInfo: "/posts/1"
                }, app, this.callback);
            },
            "should return 404": function (err, status, headers, body) {
                assert.equal(status, 404);
            }
        },
        'with a router that returns an "X-Cascade: pass" header': {
            topic: function () {
                var localRouter = router();

                localRouter.route("/path", pass(idApp("1")));
                localRouter.route("/path", idApp("2"));

                return localRouter;
            },
            "when that route matches": {
                topic: function (app) {
                    mock.request("/path", app, this.callback);
                },
                "should cascade to the next route": function (err, status, headers, body) {
                    assert.ok(headers["X-Id"]);
                    assert.equal(headers["X-Id"], "2");
                }
            },
            "when no routes match": {
                topic: function (app) {
                    mock.request("/", app, this.callback);
                },
                "should return a 404 (default app)": function (err, status, headers, body) {
                    assert.equal(status, 404);
                }
            }
        }
    }
}).export(module);

function idApp(id) {
    return function (env, callback) {
        callback(200, {
            "Content-Type": "text/plain",
            "X-Id": id
        }, "");
    }
}

// Inserts an "X-Cascade: pass" header in the response.
function pass(app) {
    return function (env, callback) {
        app(env, function (status, headers, body) {
            headers["X-Cascade"] = "pass";
            callback(status, headers, body);
        });
    }
}

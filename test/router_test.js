var assert = require("assert"),
    vows = require("vows"),
    mock = require("./../lib/link/mock"),
    Router = require("./../lib/link/router");

vows.describe("router").addBatch({
    "Router.compileRoute": {
        "should properly recognize valid identifiers": function () {
            var keys, pattern;

            keys = [];
            pattern = Router.compileRoute("/users/:id", keys);

            assert.ok(pattern);
            assert.deepEqual(keys, ["id"]);
            assert.match("/users/1", pattern);
            assert.match("/users/asdf1324_", pattern);

            keys = [];
            pattern = Router.compileRoute("/users/:$id/photos/:_photo_id", keys);

            assert.ok(pattern);
            assert.deepEqual(keys, ["$id", "_photo_id"]);
            assert.match("/users/1/photos/1", pattern);
        },
        "should properly recognize the splat character": function () {
            var keys = [];
            var pattern = Router.compileRoute("/users/*", keys);

            assert.ok(pattern);
            assert.deepEqual(keys, ["splat"]);
            assert.match("/users/1", pattern);
            assert.match("/users/1/photos/1", pattern);
        },
        "should ignore invalid identifiers": function () {
            var keys = [];
            var pattern = Router.compileRoute("/users/:1id");

            assert.ok(pattern);
            assert.isEmpty(keys);
        }
    },
    "A Router": {
        topic: function () {
            var app = function (env, callback) {
                var route = env["link.route"];

                assert.ok(route);

                callback(200, {
                    "X-Route": JSON.stringify(route),
                    "X-Id": String(route.id),
                    "Content-Type": "text/plain"
                }, "");
            }

            var router = new Router;

            router.route(/\/users\/(\d+)/i, app);
            router.route("/posts/:id", app, "GET");
            router.route("/posts/:id", app, ["POST", "DELETE"]);

            return router;
        },
        "should dispatch routes correctly": function (app) {
            mock.request("/users/1", app, function (status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/users/1", "1"]);
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "undefined");
            });

            mock.request("/posts/1", app, function (status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/posts/1", "1"]);
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "1");
            });

            mock.request({
                requestMethod: "POST",
                pathInfo: "/posts/2"
            }, app, function (status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/posts/2", "2"]);
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "2");
            });

            mock.request({
                requestMethod: "DELETE",
                pathInfo: "/posts/3"
            }, app, function (status, headers, body) {
                assert.ok(headers["X-Route"]);
                assert.deepEqual(JSON.parse(headers["X-Route"]), ["/posts/3", "3"]);
                assert.ok(headers["X-Id"]);
                assert.equal(headers["X-Id"], "3");
            });

            // PUT is not part of the routes
            mock.request({
                requestMethod: "PUT",
                pathInfo: "/posts/1"
            }, app, function (status, headers, body) {
                assert.equal(status, 404);
            });
        }
    }
}).export(module);

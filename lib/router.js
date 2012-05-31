var strata = require("./index"),
    utils = require("./utils");

module.exports = routerMiddleware;

/**
 * A middleware that provides pattern-based routing for URL's, with optional
 * support for restricting matches to a specific request method. Populates
 * `env.route` with an object containing the results of the match for all
 * downstream apps.
 *
 *   var app = strata.router();
 *
 *   app.get("/", function (env, callback) {
 *       callback(200, {}, "Welcome home!");
 *   });
 *
 *   app.get("/login", function (env, callback) {
 *       callback(200, {}, "Please login.");
 *   });
 *
 *   app.post("/login", function (env, callback) {
 *       // login logic goes here...
 *   });
 *
 *   app.get("/users/:id", function (env, callback) {
 *       var userId = env.route.id;
 *       // find the user with the given id...
 *   });
 *
 * Note: All routes are tried in the order they were defined.
 */
function routerMiddleware(app) {
    app = app || utils.notFound;

    var routes = {};

    function router(env, callback) {
        var method = env.requestMethod;
        var localRoutes = (routes[method] || []).concat(routes.ANY || []);
        var tryRoute = tryRoutes(localRoutes, env, callback, app);

        tryRoute(0);
    }

    /**
     * Routes all requests with a pathInfo that match the given `pattern` to the
     * given `app`. If the `pattern` is a string, it is compiled using
     * `utils.compileRoute`.
     *
     * If `methods` are given, the match will only occur when the `requestMethod`
     * matches one of those methods. Otherwise, the route is not restricted to a
     * certain request method.
     */
    router.route = function (pattern, app, methods) {
        methods = methods || ["ANY"];

        if (typeof methods === "string") {
            methods = [methods];
        }

        var keys = [];

        if (typeof pattern === "string") {
            pattern = utils.compileRoute(pattern, keys);
        }

        if (!utils.isRegExp(pattern)) {
            throw new strata.Error("Pattern must be a RegExp");
        }

        var method;
        for (var i = 0, len = methods.length; i < len; ++i) {
            method = methods[i].toUpperCase();

            if (!routes[method]) {
                routes[method] = [];
            }

            routes[method].push([pattern, keys, app]);
        }
    };

    // Add sugar methods for common HTTP verbs. Note that `get` defines
    // routes for both GET *and* HEAD requests.

    var methods = {
        get: ["GET", "HEAD"],
        post: "POST",
        put: "PUT",
        delete: "DELETE",
        head: "HEAD",
        options: "OPTIONS"
    };

    for (var method in methods) {
        (function (verbs) {
            router[method] = function (pattern, app) {
                this.route(pattern, app, verbs);
            };
        })(methods[method]);
    }

    /**
     * Specifies the app to run when no routes match.
     */
    router.run = function (localApp) {
        app = localApp;
    };

    return router;
}

function tryRoutes(routes, env, callback, defaultApp) {
    return function tryRoute(n) {
        var route = routes[n];

        if (!route) {
            defaultApp(env, callback);
            return;
        }

        var pattern = route[0];
        var keys = route[1];
        var app = route[2];

        var match = pattern.exec(env.pathInfo);

        if (match) {
            var obj = Array.prototype.slice.call(match, 0);

            // Define getters/setters for named keys.
            for (var i = 0, len = keys.length; i < len; ++i) {
                (function (i) {
                    var idx = i + 1;
                    obj.__defineGetter__(keys[i], function () {
                        return this[idx];
                    });
                    obj.__defineSetter__(keys[i], function (value) {
                        this[idx] = value;
                    });
                })(i);
            }

            var oldRoute = env.route;
            env.route = obj;

            app(env, function (status, headers, body) {
                // Restore the old route for upstream apps.
                if (oldRoute) {
                    env.route = oldRoute;
                } else {
                    delete env.route;
                }

                if (headers["X-Cascade"] == "pass") {
                    tryRoute(n + 1);
                } else {
                    callback(status, headers, body);
                }
            });
        } else {
            tryRoute(n + 1);
        }
    }
}

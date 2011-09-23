var strata = require("./index"),
    utils = require("./utils"),
    errors = require("./errors");

module.exports = Router;

/**
 * Provides pattern-based routing for URL's, with optional support for
 * restricting matches to a specific request method. Populates env.route with
 * an object containing the results of the match. Tries all routes in the order
 * they were defined.
 */
function Router(app) {
    this.routes = {};
    this.run(app || utils.notFound);
}

/**
 * Compiles the given string +route+ into a RegExp that can be used to match
 * it. The route may contain named keys in the form of a colon followed by a
 * valid JavaScript identifier (e.g. ":name", ":_name", or ":$name" are all
 * valid keys). If it does, these keys will be added to the given +keys+ array.
 *
 * If the route contains the special "*" symbol, it will automatically create a
 * key named "splat" and will substituted with a "(.*?)" pattern in the
 * resulting RegExp.
 */
Router.compileRoute = function compileRoute(route, keys) {
    var pattern = route.replace(/((:[a-z_$][a-z0-9_$]*)|[*.+()])/ig, function (match) {
        switch (match) {
        case "*":
            keys.push("splat");
            return "(.*?)";
        case ".":
        case "+":
        case "(":
        case ")":
            return utils.escapeRe(match);
        }

        keys.push(match.substring(1));
        return "([^/?#]+)";
    });

    return new RegExp("^" + pattern + "$");
}

/**
 * Routes all requests with a pathInfo that match the given +pattern+ to the
 * given +app+. If the +pattern+ is a string, it is compiled using
 * +Router.compileRoute+.
 *
 * If +methods+ are given, the match will only occur when the +requestMethod+
 * matches one of those methods. Otherwise, the route is not restricted to a
 * certain request method.
 */
Router.prototype.route = function route(pattern, app, methods) {
    methods = methods || ["ANY"];

    if (typeof methods == "string") {
        methods = [methods];
    }

    var keys = [];

    if (typeof pattern == "string") {
        pattern = Router.compileRoute(pattern, keys);
    }

    if (!utils.isRe(pattern)) {
        throw new errors.Error("Pattern must be a RegExp");
    }

    var method;
    for (var i = 0, len = methods.length; i < len; ++i) {
        method = methods[i].toUpperCase();

        if (!this.routes[method]) {
            this.routes[method] = [];
        }

        this.routes[method].push([pattern, keys, app]);
    }
}

var methods = {
    get: "GET",
    post: "POST",
    put: "PUT",
    del: "DELETE",
    head: "HEAD",
    options: "OPTIONS"
};

for (var method in methods) {
    (function (verb) {
        Router.prototype[method] = function (pattern, app) {
            this.route(pattern, app, verb);
        }
    })(methods[method]);
}

Router.prototype.run = function run(app) {
    this.app = app;
}

Router.prototype.call = function call(env, callback) {
    var routes = this.routes[env.requestMethod];

    if (routes && tryRoutes(routes, env, callback)) {
        return;
    }

    routes = this.routes.ANY;

    if (routes && tryRoutes(routes, env, callback)) {
        return;
    }

    this.app(env, callback);
}

Router.prototype.toApp = function toApp() {
    var router = this;
    return function (env, callback) {
        router.call(env, callback);
    }
}

function tryRoutes(routes, env, callback) {
    var route, pattern, keys, app, match;
    for (var i = 0, len = routes.length; i < len; ++i) {
        route = routes[i];
        pattern = route[0];
        keys = route[1];
        app = route[2];

        match = pattern.exec(env.pathInfo);

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

                callback(status, headers, body);
            });

            return true;
        }
    }

    return false;
}

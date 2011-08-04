var link = require("./../link"),
    utils = require("./utils");

module.exports = Router;

function Router() {
    this.routes = {};
}

Router.prototype.route = function route(methods, pattern, app) {
    if (utils.isRe(methods)) {
        app = pattern;
        pattern = methods;
        methods = ["ANY"];
    } else if (typeof methods == "string") {
        methods = [methods];
    }

    if (typeof pattern == "string") {
        pattern = new RegExp(utils.escapeRe(pattern));
    }

    if (!utils.isRe(pattern)) {
        throw new link.Error("Pattern must be a RegExp");
    }

    var method;
    for (var i = 0, len = methods.length; i < len; ++i) {
        method = methods[i].toUpperCase();

        if (!this.routes[method]) {
            this.routes[method] = [];
        }

        this.routes[method].push([pattern, app]);
    }
}

Router.prototype.call = function call(env, callback) {
    this._dispatch(env, callback);
}

Router.prototype._dispatch = function dispatch(env, callback) {
    var routes = this.routes[env.requestMethod];

    if (routes && this._tryRoutes(routes, env, callback)) {
        return;
    }

    routes = this.routes["ANY"];

    if (routes) {
        this._tryRoutes(routes, env, callback);
    }
}

Router.prototype._tryRoutes = function tryRoutes(routes, env, callback) {
    var route, pattern, app, match;

    for (var i = 0, len = routes.length; i < len; ++i) {
        route = routes[i];

        pattern = route[0];
        app = route[1];

        match = pattern.exec(env.pathInfo);

        if (match) {
            env["link.route"] = Array.prototype.slice.call(match, 1);
            app(env, callback);
            return true;
        }
    }

    return false;
}

Router.prototype.toApp = function toApp() {
    return (function (router) {
        return function (env, callback) {
            router.call(env, callback);
        }
    })(this);
}

var strata = require("./index"),
    utils = require("./utils");

module.exports = Mapper;

/**
 * Provides host and/or location-based routing. Modifies the environment's
 * scriptName and pathInfofor all downstream apps such that the part relevant
 * for dispatch is in scriptName and the rest in pathInfo. This should be taken
 * into account in downstream apps that need to create links, for example.
 *
 * Dispatch is done in such a way that the longest paths are tried first, since
 * they are the most specific.
 */
function Mapper(app) {
    this.routes = [];
    this._sorted = 0;
    this.run(app || utils.notFound);
}

/**
 * Builds and returns a new Mapper from the location/app pairs specified in
 * the given +map+.
 */
Mapper.fromMap = function (map, app) {
    var mapper = new Mapper(app);

    for (var location in map) {
        mapper.map(location, map[location]);
    }

    return mapper;
}

Mapper.prototype.map = function map(location, app) {
    var match = location.match(/^https?:\/\/(.*?)(\/.*)/),
        host;

    if (match) {
        host = match[1];
        location = match[2];
    }

    if (location.charAt(0) != "/") {
        throw new strata.Error('Location must start with "/" (was: ' + location + ")");
    }

    location = location.replace(/\/$/, "");

    var pattern = utils.escapeRe(location).replace(/\/+/g, "/+");
    var matcher = new RegExp("^" + pattern + "(.*)");

    this.routes.push([host, location, matcher, app]);
}

Mapper.prototype.run = function run(app) {
    this.app = app;
}

Mapper.prototype.call = function call(env, callback) {
    var len = this.routes.length;

    if (this._sorted !== len) {
        // Sort routes by most specific location (longest first).
        this.routes.sort(function(a, b) {
            return (b[1].length - a[1].length) || ((b[0] || "").length - (a[0] || "").length);
        });

        this._sorted = len;
    }

    var serverName = env.serverName,
        scriptName = env.scriptName,
        pathInfo = env.pathInfo,
        httpHost = env.httpHost || null;

    var route, host, location, matcher, app, match, rest;
    for (var i = 0; i < len; ++i) {
        route = this.routes[i];

        host = route[0];
        location = route[1];
        matcher = route[2];
        app = route[3];

        // Try to match the host.
        if (host && host !== httpHost && host !== serverName) {
            continue;
        }

        // Try to match the path.
        match = pathInfo.match(matcher);
        if (match) {
            rest = match[1];
        } else {
            continue;
        }

        // Skip if the remaining path doesn't start with a "/".
        if (rest.length > 0 && rest[0] != "/") {
            continue;
        }

        // Adjust scriptName and pathInfo for downstream apps.
        env.scriptName = scriptName + location;
        env.pathInfo = rest;

        app(env, function (status, headers, body) {
            // Reset scriptName and pathInfo for upstream apps.
            env.scriptName = scriptName;
            env.pathInfo = pathInfo;

            callback(status, headers, body);
        });

        return;
    }

    this.app(env, callback);
}

Mapper.prototype.toApp = function toApp() {
    var mapper = this;
    return function (env, callback) {
        mapper.call(env, callback);
    }
}

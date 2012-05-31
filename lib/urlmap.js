var strata = require("./index"),
    utils = require("./utils");

module.exports = urlMapMiddleware;

/**
 * A middleware that provides host and/or location-based routing. Modifies
 * `env.scriptName` and `env.pathInfo` for all downstream apps such that the
 * part relevant for dispatch is in `scriptName` and the rest in `pathInfo`.
 * This should be taken into account in downstream apps that need to create
 * links, for example.
 *
 *   var app = strata.urlMap();
 *
 *   app.map("/files", function (env, callback) {
 *       // env.scriptName is "/files", env.pathInfo is remainder of URL
 *   });
 *
 * Note: Dispatch is done in such a way that the longest paths are tried first
 * since they are the most specific.
 */
function urlMapMiddleware(app) {
    app = app || utils.notFound;

    var mappings = [];
    var sorted = 0;

    function urlMap(env, callback) {
        var len = mappings.length;

        if (sorted !== len) {
            // Sort mappings by most specific location (longest first).
            mappings.sort(function (a, b) {
                return (b[1].length - a[1].length) || ((b[0] || "").length - (a[0] || "").length);
            });

            sorted = len;
        }

        var serverName = env.serverName,
            scriptName = env.scriptName,
            pathInfo = env.pathInfo,
            httpHost = env.httpHost || null;

        var mapping, host, location, matcher, localApp, match, rest;
        for (var i = 0; i < len; ++i) {
            mapping = mappings[i];

            host = mapping[0];
            location = mapping[1];
            matcher = mapping[2];
            localApp = mapping[3];

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

            localApp(env, function (status, headers, body) {
                // Reset scriptName and pathInfo for upstream apps.
                env.scriptName = scriptName;
                env.pathInfo = pathInfo;

                callback(status, headers, body);
            });

            return;
        }

        app(env, callback);
    }

    /**
     * Designates the given `app` as the one that should be called for all
     * requests that match the given `location`. The location may contain host
     * information as well as path information to route the request based on
     * host as well as path.
     */
    urlMap.map = function (location, app) {
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

        mappings.push([host, location, matcher, app]);
    };

    /**
     * Specifies the app to run when no mappings match.
     */
    urlMap.run = function (localApp) {
        app = localApp;
    };

    return urlMap;
}

/**
 * Creates a new map middleware from the location/app pairs in `locationsMap`.
 */
urlMapMiddleware.make = function (locationsMap) {
    var urlMap = urlMapMiddleware();

    for (var location in locationsMap) {
        urlMap.map(location, locationsMap[location]);
    }

    return urlMap;
};

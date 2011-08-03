var utils = require("./utils");

/**
 * A middleware for dispatching to different apps based on the current value
 * of the pathInfo environment variable. This middleware modifies scriptName
 * and pathInfo for all downstream apps such that the part relevant for dispatch
 * is in scriptName and the rest in pathInfo. This should be taken into account
 * in downstream apps that need to create links, for example.
 *
 * Dispatch is done in such a way that the longest paths are tried first, since
 * they are the most specific.
 */
module.exports = function (map) {
    map = map || {};

    var routes = [],
        pattern,
        matcher;

    var app, host, match;
    for (var location in map) {
        app = map[location],
        host = null,
        match = location.match(/^https?:\/\/(.*?)(\/.*)/);

        if (match) {
            host = match[1];
            location = match[2];
        }

        if (location.charAt(0) != "/") {
            throw new Error('Path must start with "/" (was: ' + location + ")");
        }

        location = location.replace(/\/$/, "");

        pattern = utils.escapeRe(location).replace(/\//g, "/+");
        matcher = new RegExp("^" + pattern + "(.*)");

        routes.push([host, location, matcher, app]);
    }

    // Sort routes by most specific (longest first).
    routes.sort(function(a, b) {
        return (b[1].length - a[1].length) || ((b[0] || "").length - (a[0] || "").length);
    });

    return function urlMap(env, callback) {
        var scriptName = env.scriptName,
            pathInfo = env.pathInfo,
            httpHost = env.httpHost || null,
            serverName = env.serverName,
            serverPort = env.serverPort;

        var route, host, location, matcher, app, match, rest;
        for (var i = 0, len = routes.length; i < len; ++i) {
            route = routes[i];

            host = route[0];
            location = route[1];
            matcher = route[2];
            app = route[3];

            // Try to match the host/port.
            if (host !== httpHost &&
                host !== serverName &&
                (host || (httpHost !== serverName && httpHost !== serverName + ":" + serverPort))) {
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

        notFound(env, callback);
    }
}

function notFound(env, callback) {
    callback(404, {
        "Content-Type": "text/plain",
        "X-Cascade": "pass"
    }, "Not found: " + env.pathInfo);
}

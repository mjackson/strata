var strata = require("./index"),
    utils = require("./utils");

/**
 * A middleware for "mounting" any number of apps at a certain URL prefix. The
 * `map` contains pairs of virtual locations to apps. The middleware calls the
 * first app whose location matches the request.
 */
module.exports = function (map, defaultApp) {
    defaultApp = defaultApp || utils.notFound;

    var mappings = [];

    var app, match, host, pattern, matcher;
    for (var location in map) {
        app = map[location];
        match = location.match(/^https?:\/\/(.*?)(\/.*)/);

        if (match) {
            host = match[1];
            location = match[2];
        } else {
            host = null;
        }

        if (location.charAt(0) != "/") {
            throw new strata.Error('Location must start with "/" (was: ' + location + ")");
        }

        location = location.replace(/\/$/, "");
        pattern = utils.escapeRe(location).replace(/\/+/g, "/+");
        matcher = new RegExp("^" + pattern + "(.*)");

        mappings.push([host, location, matcher, app]);
    }

    // Sort mappings by most specific location (longest first).
    mappings.sort(function(a, b) {
        return (b[1].length - a[1].length) || ((b[0] || "").length - (a[0] || "").length);
    });

    return function urlmap(env, callback) {
        var serverName = env.serverName,
            scriptName = env.scriptName,
            pathInfo = env.pathInfo,
            httpHost = env.httpHost || null;

        var mapping, host, location, matcher, app, match, rest;
        for (var i = 0, len = mappings.length; i < len; ++i) {
            mapping = mappings[i];
            host = mapping[0];
            location = mapping[1];
            matcher = mapping[2];
            app = mapping[3];

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

        defaultApp(env, callback);
    }
}
